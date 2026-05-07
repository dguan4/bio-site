"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import StatsBar from "@/components/github/StatsBar";
import ContributionHeatmap from "@/components/github/ContributionHeatmap";
import ActivityFeed from "@/components/github/ActivityFeed";
import RepoCards from "@/components/github/RepoCards";
import { useGitHubData } from "@/hooks/useGitHubData";

// Recharts uses DOM APIs — must be dynamically imported with ssr:false
const LanguageChart = dynamic(
  () => import("@/components/github/LanguageChart"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />,
  }
);

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function GitHubTab() {
  const { data, loading, error } = useGitHubData();

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-sm font-medium text-destructive">Failed to load GitHub data</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <StatsBar stats={data.stats} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Contributions
        </h2>
        <ContributionHeatmap
          contributions={data.contributions}
          fromToken={data.contributionsFromToken}
        />
      </section>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Languages
          </h2>
          <LanguageChart languages={data.languages} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Recent Activity
          </h2>
          <ActivityFeed events={data.events} />
        </section>
      </div>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Top Repositories
        </h2>
        <RepoCards repos={data.topRepos} />
      </section>
    </div>
  );
}
