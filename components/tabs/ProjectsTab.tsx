"use client";

import { ExternalLink, Star, GitFork } from "lucide-react";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGitHubData } from "@/hooks/useGitHubData";
import type { ProjectOverride, GitHubRepo } from "@/lib/types";

interface UnifiedProject {
  name: string;
  description: string;
  url: string;
  github?: string;
  tags: string[];
  stars?: number;
  forks?: number;
  language?: string;
  featured?: boolean;
  source: "override" | "github";
}

function repoToProject(repo: GitHubRepo): UnifiedProject {
  return {
    name: repo.name,
    description: repo.description ?? "",
    url: repo.html_url,
    github: repo.html_url,
    tags: repo.topics,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language ?? undefined,
    featured: false,
    source: "github",
  };
}

function overrideToProject(o: ProjectOverride): UnifiedProject {
  return {
    name: o.name,
    description: o.description,
    url: o.url,
    github: o.github,
    tags: o.tags ?? [],
    featured: o.featured ?? false,
    source: "override",
  };
}

interface Props {
  projectOverrides: ProjectOverride[];
}

function ProjectCard({ project }: { project: UnifiedProject }) {
  return (
    <Card className="border-border/50 hover:border-border transition-colors group flex flex-col">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-tight">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              {project.name}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </a>
          </CardTitle>

          <div className="flex items-center gap-1 shrink-0">
            {project.github && project.github !== project.url && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
              </a>
            )}
            {project.stars != null && project.stars > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3" />
                {project.stars}
              </span>
            )}
            {project.forks != null && project.forks > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <GitFork className="h-3 w-3" />
                {project.forks}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-between gap-2">
        {project.description && (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-3">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {project.language && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
              {project.language}
            </Badge>
          )}
          {project.tags.slice(0, 4).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
              {t}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectsTab({ projectOverrides }: Props) {
  const { data, loading, error } = useGitHubData();

  const overrides = projectOverrides.map(overrideToProject);
  const githubProjects = data ? data.topRepos.map(repoToProject) : [];

  // Merge: overrides first (featured ones pinned to top), then GitHub repos
  // excluding any repos whose name matches an override
  const overrideNames = new Set(overrides.map((o) => o.name.toLowerCase()));
  const filteredGitHub = githubProjects.filter(
    (p) => !overrideNames.has(p.name.toLowerCase())
  );

  const featured = overrides.filter((o) => o.featured);
  const rest = [
    ...overrides.filter((o) => !o.featured),
    ...filteredGitHub,
  ];

  if (loading && !overrides.length) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (error && !overrides.length) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        <p>Could not load GitHub repos.</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  const allProjects = [...featured, ...rest];

  return (
    <div className="space-y-6">
      {featured.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Featured
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featured.map((p) => (
              <ProjectCard key={p.name} project={p} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="space-y-3">
          {featured.length > 0 && (
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              All Projects
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(featured.length > 0 ? rest : allProjects).map((p) => (
              <ProjectCard key={`${p.source}-${p.name}`} project={p} />
            ))}
          </div>
        </section>
      )}

      {allProjects.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-12">
          No projects to display.
        </p>
      )}
    </div>
  );
}
