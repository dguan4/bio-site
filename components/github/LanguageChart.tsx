"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00add8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  Swift: "#fa7343",
  Kotlin: "#A97BFF",
  PHP: "#4F5D95",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Scala: "#c22d40",
  Haskell: "#5e5086",
  Elixir: "#6e4a7e",
  Clojure: "#db5855",
  Lua: "#000080",
  Vim: "#199f4b",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};

function getColor(lang: string, index: number): string {
  if (LANGUAGE_COLORS[lang]) return LANGUAGE_COLORS[lang];
  // Deterministic fallback color
  const hue = (index * 47 + 180) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

interface Props {
  languages: Record<string, number>;
}

export default function LanguageChart({ languages }: Props) {
  const sorted = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const total = sorted.reduce((s, [, n]) => s + n, 0);

  const data = sorted.map(([name, count]) => ({
    name,
    value: count,
    pct: Math.round((count / total) * 100),
  }));

  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No language data available.
      </p>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="50%"
            outerRadius="75%"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={getColor(entry.name, index)}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value} repo${value !== 1 ? "s" : ""} (${Math.round((value / total) * 100)}%)`,
              name,
            ]}
            contentStyle={{
              backgroundColor: "#1c1c1c",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span style={{ fontSize: 11, color: "#aaa" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
