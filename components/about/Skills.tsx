import { Badge } from "@/components/ui/badge";

interface Props {
  skills: string[];
}

export default function Skills({ skills }: Props) {
  if (!skills.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Skills
      </h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="text-xs font-medium px-2.5 py-0.5"
          >
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}
