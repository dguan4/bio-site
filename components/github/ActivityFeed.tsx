import { GitCommit, GitPullRequest, AlertCircle, Star, GitFork, Tag, GitBranch } from "lucide-react";
import type { GitHubEvent } from "@/lib/types";

interface Props {
  events: GitHubEvent[];
}

function formatEventAction(event: GitHubEvent): { icon: React.ComponentType<{ className?: string }>; text: string } | null {
  const repo = event.repo.name;

  switch (event.type) {
    case "PushEvent": {
      const commits = event.payload.commits ?? [];
      const n = commits.length;
      const msg = commits[0]?.message?.split("\n")[0] ?? "";
      return {
        icon: GitCommit,
        text: `Pushed ${n} commit${n !== 1 ? "s" : ""} to ${repo}${msg ? ` — ${msg}` : ""}`,
      };
    }
    case "PullRequestEvent": {
      const pr = event.payload.pull_request;
      const action = event.payload.action ?? "";
      return {
        icon: GitPullRequest,
        text: `${action.charAt(0).toUpperCase() + action.slice(1)} PR${pr ? ` #${pr.number}: ${pr.title}` : ""} in ${repo}`,
      };
    }
    case "IssuesEvent": {
      const issue = event.payload.issue;
      const action = event.payload.action ?? "";
      return {
        icon: AlertCircle,
        text: `${action.charAt(0).toUpperCase() + action.slice(1)} issue${issue ? ` #${issue.number}: ${issue.title}` : ""} in ${repo}`,
      };
    }
    case "WatchEvent":
      return { icon: Star, text: `Starred ${repo}` };
    case "ForkEvent":
      return { icon: GitFork, text: `Forked ${repo}` };
    case "CreateEvent": {
      const refType = event.payload.ref_type ?? "repository";
      const ref = event.payload.ref ?? "";
      return {
        icon: refType === "tag" ? Tag : GitBranch,
        text: `Created ${refType}${ref ? ` ${ref}` : ""} in ${repo}`,
      };
    }
    case "ReleaseEvent": {
      const tag = event.payload.release?.tag_name ?? "";
      return { icon: Tag, text: `Released ${tag} in ${repo}` };
    }
    default:
      return null;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

export default function ActivityFeed({ events }: Props) {
  const items = events
    .map((e) => ({ event: e, action: formatEventAction(e) }))
    .filter((x): x is { event: GitHubEvent; action: NonNullable<ReturnType<typeof formatEventAction>> } => x.action !== null)
    .slice(0, 15);

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No recent activity.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map(({ event, action }) => {
        const Icon = action.icon;
        return (
          <li key={event.id} className="flex items-start gap-2 text-sm">
            <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <span className="flex-1 leading-snug text-foreground/80 truncate">
              {action.text}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {timeAgo(event.created_at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
