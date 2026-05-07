import type { WorkExperience } from "@/lib/types";

interface Props {
  experience: WorkExperience[];
}

function formatDate(ym: string): string {
  if (ym === "present") return "Present";
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function ExperienceTimeline({ experience }: Props) {
  if (!experience.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Experience
      </h2>

      <ol className="relative border-l border-border ml-3 space-y-6">
        {experience.map((job, i) => (
          <li key={i} className="ml-6">
            {/* Timeline dot */}
            <span className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />

            <div className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                <p className="font-semibold leading-tight">{job.role}</p>
                <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  {formatDate(job.start)} — {formatDate(job.end)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-medium">{job.company}</p>
              <p className="text-sm leading-relaxed">{job.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
