import { NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";

function headers() {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export async function GET() {
  const pageId = process.env.NOTION_NOW_PAGE_ID;
  const token = process.env.NOTION_API_KEY;

  if (!pageId || !token) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const h = headers();

  const [pageRes, blocksRes] = await Promise.all([
    fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: h,
      next: { revalidate: 300 },
    }),
    fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
      headers: h,
      next: { revalidate: 300 },
    }),
  ]);

  if (!pageRes.ok) {
    return NextResponse.json(
      { error: `Notion page fetch failed: ${pageRes.status}` },
      { status: pageRes.status },
    );
  }
  if (!blocksRes.ok) {
    return NextResponse.json(
      { error: `Notion blocks fetch failed: ${blocksRes.status}` },
      { status: blocksRes.status },
    );
  }

  const page = await pageRes.json();
  const blocks = await blocksRes.json();

  return NextResponse.json({
    lastEdited: page.last_edited_time as string,
    blocks: blocks.results as unknown[],
  });
}
