"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// ── Notion block types ────────────────────────────────────────────────────────

interface NotionAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  code: boolean;
}

interface NotionRichText {
  plain_text: string;
  annotations: NotionAnnotations;
  href: string | null;
}

interface NotionBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface NowData {
  lastEdited: string;
  blocks: NotionBlock[];
}

// ── Rich text renderer ────────────────────────────────────────────────────────

function RichText({ items }: { items: NotionRichText[] }) {
  return (
    <>
      {items.map((rt, i) => {
        const { bold, italic, code, strikethrough } = rt.annotations;
        const cn =
          [bold && "font-semibold", italic && "italic", strikethrough && "line-through"]
            .filter(Boolean)
            .join(" ") || undefined;

        if (rt.href) {
          return (
            <a
              key={i}
              href={rt.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {rt.plain_text}
            </a>
          );
        }
        if (code) {
          return (
            <code key={i} className={`bg-muted px-1 py-0.5 rounded text-sm font-mono${cn ? " " + cn : ""}`}>
              {rt.plain_text}
            </code>
          );
        }
        return (
          <span key={i} className={cn}>
            {rt.plain_text}
          </span>
        );
      })}
    </>
  );
}

function richText(block: NotionBlock, key: string): NotionRichText[] {
  return ((block[key] as { rich_text: NotionRichText[] })?.rich_text) ?? [];
}

// ── Block renderer ────────────────────────────────────────────────────────────

function Block({ block }: { block: NotionBlock }) {
  switch (block.type) {
    case "paragraph": {
      const rt = richText(block, "paragraph");
      if (!rt.length) return <div className="py-1" />;
      return <p className="leading-relaxed"><RichText items={rt} /></p>;
    }
    case "heading_1":
      return <h2 className="text-xl font-bold mt-6 mb-2"><RichText items={richText(block, "heading_1")} /></h2>;
    case "heading_2":
      return <h3 className="text-lg font-semibold mt-5 mb-1.5"><RichText items={richText(block, "heading_2")} /></h3>;
    case "heading_3":
      return <h4 className="font-semibold mt-4 mb-1"><RichText items={richText(block, "heading_3")} /></h4>;
    case "bulleted_list_item":
      return <li className="ml-5 list-disc leading-relaxed"><RichText items={richText(block, "bulleted_list_item")} /></li>;
    case "numbered_list_item":
      return <li className="ml-5 list-decimal leading-relaxed"><RichText items={richText(block, "numbered_list_item")} /></li>;
    case "quote":
      return (
        <blockquote className="border-l-2 border-border pl-4 text-muted-foreground italic">
          <RichText items={richText(block, "quote")} />
        </blockquote>
      );
    case "callout": {
      const callout = block.callout as { rich_text: NotionRichText[]; icon?: { emoji?: string } };
      return (
        <div className="flex gap-3 bg-muted rounded-lg px-4 py-3">
          {callout.icon?.emoji && <span className="shrink-0">{callout.icon.emoji}</span>}
          <p className="leading-relaxed"><RichText items={callout.rich_text} /></p>
        </div>
      );
    }
    case "divider":
      return <hr className="border-border" />;
    case "to_do": {
      const todo = block.to_do as { rich_text: NotionRichText[]; checked: boolean };
      return (
        <div className="flex items-start gap-2">
          <input type="checkbox" checked={todo.checked} readOnly className="mt-1 accent-primary" />
          <span className={todo.checked ? "line-through text-muted-foreground" : ""}>
            <RichText items={todo.rich_text} />
          </span>
        </div>
      );
    }
    default:
      return null;
  }
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function NowSkeleton() {
  return (
    <div className="max-w-prose space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-4 w-64" />
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NowTab() {
  const [data, setData] = useState<NowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    fetch("/api/notion")
      .then((r) => r.json())
      .then((d: NowData & { error?: string }) => {
        if (d.error === "not_configured") {
          setNotConfigured(true);
        } else if (!d.error) {
          setData(d);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <NowSkeleton />;

  if (notConfigured) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <p className="text-sm font-medium">Notion not configured</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Set{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-[11px]">NOTION_API_KEY</code> and{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-[11px]">NOTION_NOW_PAGE_ID</code> in
          your environment to power this tab from a Notion page.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Failed to load — check your Notion API credentials.
      </div>
    );
  }

  return (
    <div className="max-w-prose space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Now</h2>
          <p className="text-sm text-muted-foreground mt-0.5">A snapshot of what I&apos;m currently up to.</p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 mt-1">
          Updated {formatDistanceToNow(new Date(data.lastEdited), { addSuffix: true })}
        </span>
      </div>

      <Separator />

      <div className="space-y-3">
        {data.blocks.map((block) => (
          <Block key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}
