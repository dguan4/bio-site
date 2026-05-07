// ── Profile (profile.json) ────────────────────────────────────────────────────

export interface SocialLink {
  platform: string;
  url: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  start: string;   // "YYYY-MM"
  end: string;     // "YYYY-MM" | "present"
  description: string;
  logo?: string;
}

export interface ProjectOverride {
  name: string;
  description: string;
  url: string;
  github?: string;
  tags?: string[];
  featured?: boolean;
}

export interface Profile {
  name: string;
  title: string;
  avatar?: string;
  bio: string;
  location?: string;
  email?: string;
  skills: string[];
  social: SocialLink[];
  experience: WorkExperience[];
  projectOverrides: ProjectOverride[];
}

// ── GitHub REST API ───────────────────────────────────────────────────────────

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  fork: boolean;
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: {
    name: string;
    url: string;
  };
  payload: {
    commits?: Array<{ message: string; sha: string }>;
    action?: string;
    ref?: string;
    ref_type?: string;
    pull_request?: { title: string; number: number };
    issue?: { title: string; number: number };
    release?: { tag_name: string };
  };
}

// ── Processed GitHub data ─────────────────────────────────────────────────────

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubStats {
  totalStars: number;
  totalForks: number;
  estimatedCommits: number;
  followers: number;
  publicRepos: number;
}

export interface GitHubData {
  user: GitHubUser;
  repos: GitHubRepo[];
  topRepos: GitHubRepo[];
  events: GitHubEvent[];
  contributions: ContributionDay[];
  languages: Record<string, number>;
  stats: GitHubStats;
  cachedAt: number;
  contributionsFromToken: boolean;
}
