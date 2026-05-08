import { NextRequest, NextResponse } from "next/server";

const API = "https://api.deadlock-api.com/v1";
const ASSETS = "https://assets.deadlock-api.com/v2";

async function proxy(url: string, revalidate: number) {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`Upstream API error ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");

  try {
    if (type === "matches") {
      const accountId = searchParams.get("accountId");
      if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });
      const data = await proxy(`${API}/players/${accountId}/match-history?limit=20`, 300);
      return NextResponse.json(data);
    }

    if (type === "match") {
      const matchId = searchParams.get("matchId");
      if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });
      const data = await proxy(`${API}/matches/${matchId}/metadata`, 3600);
      return NextResponse.json(data);
    }

    if (type === "heroes") {
      const data = await proxy(`${ASSETS}/heroes`, 86400);
      return NextResponse.json(data);
    }

    if (type === "items") {
      const data = await proxy(`${ASSETS}/items?only_active_items=true`, 86400);
      return NextResponse.json(data);
    }

    if (type === "builds") {
      const heroId = searchParams.get("heroId");
      if (!heroId) return NextResponse.json({ error: "heroId required" }, { status: 400 });
      const data = await proxy(
        `${API}/builds?hero_id=${heroId}&sort_by=weekly_favorites&sort_direction=desc&only_latest=true&build_language=English&limit=20`,
        1800
      );
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
