import { Star, GitFork, Users, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { GitHubStats } from "@/lib/types";

interface Stat {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  stats: GitHubStats;
}

export default function StatsBar({ stats }: Props) {
  const items: Stat[] = [
    { label: "Public Repos", value: stats.publicRepos, icon: BookOpen },
    { label: "Total Stars", value: stats.totalStars, icon: Star },
    { label: "Followers", value: stats.followers, icon: Users },
    { label: "Recent Commits", value: stats.estimatedCommits, icon: GitFork },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center gap-1 py-4">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
