import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MoreTab() {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="w-full max-w-sm border-border/50 text-center">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
          <Construction className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-semibold">Coming Soon</p>
            <p className="text-sm text-muted-foreground">
              This tab is a placeholder for future content — a blog, notes, reading list, or something else entirely.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
