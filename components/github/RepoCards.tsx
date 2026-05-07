import { Star, GitFork, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GitHubRepo } from "@/lib/types";

interface Props {
  repos: GitHubRepo[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function RepoCards({ repos }: Props) {
  if (!repos.length) {
    return <p className="text-sm text-muted-foreground">No repositories found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {repos.map((repo) => (
        <Card
          key={repo.id}
          className="border-border/50 hover:border-border transition-colors group"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-semibold leading-tight">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  {repo.name}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                </a>
              </CardTitle>
              <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                {repo.stargazers_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3" />
                    {repo.stargazers_count}
                  </span>
                )}
                {repo.forks_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <GitFork className="h-3 w-3" />
                    {repo.forks_count}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-2">
            {repo.description && (
              <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                {repo.description}
              </p>
            )}

            <div className="flex flex-wrap gap-1 items-center">
              {repo.language && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                  {repo.language}
                </Badge>
              )}
              {repo.topics.slice(0, 3).map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="text-[10px] py-0 px-1.5 h-4"
                >
                  {t}
                </Badge>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground">
              Updated {timeAgo(repo.updated_at)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
