"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ContributionDay } from "@/lib/types";

// GitHub's dark-mode contribution palette
const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "#161b22",
  1: "#0e4429",
  2: "#006d32",
  3: "#26a641",
  4: "#39d353",
};

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface Props {
  contributions: ContributionDay[];
  fromToken: boolean;
}

function buildWeeks(
  contributions: ContributionDay[]
): (ContributionDay | null)[][] {
  if (!contributions.length) return [];

  // Pad front so week columns start on Sunday
  const firstDow = new Date(contributions[0].date + "T00:00:00").getDay();
  const padded: (ContributionDay | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...contributions,
  ];

  const weeks: (ContributionDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    const week = padded.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function getMonthLabels(
  weeks: (ContributionDay | null)[][]
): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, col) => {
    const firstReal = week.find((d) => d !== null);
    if (!firstReal) return;
    const month = new Date(firstReal.date + "T00:00:00").getMonth();
    if (month !== lastMonth) {
      labels.push({
        label: new Date(firstReal.date + "T00:00:00").toLocaleDateString(
          "en-US",
          { month: "short" }
        ),
        col,
      });
      lastMonth = month;
    }
  });
  return labels;
}

export default function ContributionHeatmap({ contributions, fromToken }: Props) {
  const weeks = buildWeeks(contributions);
  const monthLabels = getMonthLabels(weeks);
  const total = contributions.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{total.toLocaleString()} contributions in the last year</span>
        {!fromToken && (
          <span className="text-xs text-muted-foreground">
            (estimated from public events — add GITHUB_TOKEN for exact counts)
          </span>
        )}
      </div>

      <TooltipProvider delay={100}>
        <div className="overflow-x-auto pb-1">
          {/* Month labels */}
          <div
            className="flex gap-[2px] mb-1 pl-8"
            style={{ minWidth: weeks.length * 13 }}
          >
            {weeks.map((_, col) => {
              const lbl = monthLabels.find((m) => m.col === col);
              return (
                <div
                  key={col}
                  className="w-[11px] text-[9px] text-muted-foreground"
                  style={{ flexShrink: 0 }}
                >
                  {lbl?.label ?? ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-1">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-[2px] pr-1">
              {DAY_LABELS.map((lbl, i) => (
                <div
                  key={i}
                  className="h-[11px] text-[9px] text-muted-foreground text-right leading-none flex items-center justify-end"
                  style={{ width: 24 }}
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex gap-[2px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((day, di) =>
                    day ? (
                      <Tooltip key={di}>
                        <TooltipTrigger
                          render={
                            <div
                              className="h-[11px] w-[11px] rounded-[2px] cursor-default"
                              style={{ backgroundColor: LEVEL_COLORS[day.level] }}
                            />
                          }
                        />
                        <TooltipContent>
                          <p className="text-xs">
                            {day.count} contribution{day.count !== 1 ? "s" : ""} on{" "}
                            {new Date(day.date + "T00:00:00").toLocaleDateString(
                              "en-US",
                              { weekday: "short", month: "short", day: "numeric", year: "numeric" }
                            )}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div
                        key={di}
                        className="h-[11px] w-[11px] rounded-[2px]"
                        style={{ backgroundColor: LEVEL_COLORS[0] }}
                      />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1 mt-2 justify-end text-[10px] text-muted-foreground">
            <span>Less</span>
            {([0, 1, 2, 3, 4] as const).map((lvl) => (
              <div
                key={lvl}
                className="h-[10px] w-[10px] rounded-[2px]"
                style={{ backgroundColor: LEVEL_COLORS[lvl] }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
