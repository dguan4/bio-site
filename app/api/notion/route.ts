import { NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";

function headers() {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function fetchBlocks(blockId: string, h: HeadersInit) {
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`,
    { headers: h, cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results as unknown[];
}

export async function GET() {
  const pageId = process.env.NOTION_NOW_PAGE_ID;
  const token = process.env.NOTION_API_KEY;

  if (!pageId || !token) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const h = headers();

  const [pageRes, topBlocks] = await Promise.all([
    fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: h,
      cache: "no-store",
    }),
    fetchBlocks(pageId, h),
  ]);

  if (!pageRes.ok) {
    return NextResponse.json(
      { error: `Notion page fetch failed: ${pageRes.status}` },
      { status: pageRes.status },
    );
  }

  const page = await pageRes.json();

  // Fetch one level of children for any block that needs it (tables, toggles, etc.)
  const blocksNeedingChildren = (topBlocks as Array<{ id: string; has_children: boolean }>).filter(
    (b) => b.has_children,
  );

  const childEntries = await Promise.all(
    blocksNeedingChildren.map(async (b) => [b.id, await fetchBlocks(b.id, h)] as const),
  );

  const children = Object.fromEntries(childEntries);

  return NextResponse.json({
    lastEdited: page.last_edited_time as string,
    blocks: topBlocks,
    children,
  });
}
