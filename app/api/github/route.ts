import type {
  ContributionDay,
  GitHubData,
  GitHubEvent,
  GitHubRepo,
  GitHubUser,
} from "@/lib/types";

// ── KV helpers (no-op when env vars are absent) ───────────────────────────────

async function kvGet<T>(key: string): Promise<T | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN)
    return null;
  try {
    const { kv } = await import("@vercel/kv");
    return await kv.get<T>(key);
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: unknown, ttlSeconds: number) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(key, value, { ex: ttlSeconds });
  } catch {
    // silently degrade — caching is best-effort
  }
}

// ── GitHub fetch helpers ──────────────────────────────────────────────────────

function ghHeaders(): HeadersInit {
  const h: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    h["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

async function ghFetch(url: string) {
  const res = await fetch(url, {
    headers: ghHeaders(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
  return res.json();
}

// ── Contribution calendar ─────────────────────────────────────────────────────

function levelFromCount(n: number): 0 | 1 | 2 | 3 | 4 {
  if (n === 0) return 0;
  if (n <= 3) return 1;
  if (n <= 6) return 2;
  if (n <= 9) return 3;
  return 4;
}

async function fetchContributionsFromGraphQL(
  username: string,
  token: string
): Promise<ContributionDay[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  const json = await res.json();
  const weeks: Array<{
    contributionDays: Array<{ date: string; contributionCount: number }>;
  }> =
    json.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];

  return weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: levelFromCount(d.contributionCount),
    }))
  );
}

function buildContributionsFromEvents(
  events: GitHubEvent[]
): ContributionDay[] {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const date = e.created_at.slice(0, 10);
    counts[date] = (counts[date] ?? 0) + 1;
  }

  const days: ContributionDay[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const count = counts[date] ?? 0;
    days.push({ date, count, level: levelFromCount(count) });
  }
  return days;
}

// ── Main data fetch ───────────────────────────────────────────────────────────

async function fetchGitHubData(username: string): Promise<GitHubData> {
  const [user, allRepos, events] = await Promise.all([
    ghFetch(`https://api.github.com/users/${username}`) as Promise<GitHubUser>,
    ghFetch(
      `https://api.github.com/users/${username}/repos?sort=stars&per_page=100&type=owner`
    ) as Promise<GitHubRepo[]>,
    ghFetch(
      `https://api.github.com/users/${username}/events/public?per_page=100`
    ) as Promise<GitHubEvent[]>,
  ]);

  const ownRepos = allRepos.filter((r) => !r.fork);

  // Language frequency across non-fork repos
  const languages: Record<string, number> = {};
  for (const repo of ownRepos) {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] ?? 0) + 1;
    }
  }

  // Contribution calendar
  const token = process.env.GITHUB_TOKEN;
  let contributions: ContributionDay[];
  let contributionsFromToken = false;

  if (token) {
    try {
      contributions = await fetchContributionsFromGraphQL(username, token);
      contributionsFromToken = true;
    } catch {
      contributions = buildContributionsFromEvents(events);
    }
  } else {
    contributions = buildContributionsFromEvents(events);
  }

  const totalStars = ownRepos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = ownRepos.reduce((s, r) => s + r.forks_count, 0);
  const estimatedCommits = events.filter((e) => e.type === "PushEvent").length;

  const topRepos = [...ownRepos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);

  return {
    user,
    repos: ownRepos.slice(0, 30),
    topRepos,
    events: events.slice(0, 20),
    contributions,
    languages,
    stats: {
      totalStars,
      totalForks,
      estimatedCommits,
      followers: user.followers,
      publicRepos: user.public_repos,
    },
    cachedAt: Date.now(),
    contributionsFromToken,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME;
  if (!username) {
    return Response.json(
      { error: "NEXT_PUBLIC_GITHUB_USERNAME is not set" },
      { status: 500 }
    );
  }

  const cacheKey = `github:${username}:v2`;

  const cached = await kvGet<GitHubData>(cacheKey);
  if (cached) {
    return Response.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    const data = await fetchGitHubData(username);
    await kvSet(cacheKey, data, 3600);
    return Response.json(data, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
