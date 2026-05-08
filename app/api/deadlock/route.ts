import { NextRequest, NextResponse } from "next/server";

const API = "https://api.deadlock-api.com/v1";
const ASSETS = "https://assets.deadlock-api.com/v2";

async function proxy(url: string, revalidate: number) {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`Upstream API error ${res.status}`);
  return res.json();
}

// Items response is ~7.5MB — too large for Next.js fetch cache (2MB limit).
// Cache the filtered result in memory instead.
let _itemsCache: { data: unknown[]; expiresAt: number } | null = null;

async function fetchItems() {
  if (_itemsCache && Date.now() < _itemsCache.expiresAt) return _itemsCache.data;
  const res = await fetch(`${ASSETS}/items?only_active_items=true`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Upstream API error ${res.status}`);
  const all: Record<string, unknown>[] = await res.json();
  const data = all
    .filter((i) => i.type === "upgrade")
    .map((i) => ({
      id: i.id,
      name: i.name,
      class_name: i.class_name,
      type: i.type,
      item_slot_type: i.item_slot_type,
      item_tier: i.item_tier,
      cost: i.cost,
      shop_image: i.shop_image,
      shop_image_webp: i.shop_image_webp,
    }));
  _itemsCache = { data, expiresAt: Date.now() + 86_400_000 };
  return data;
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
      return NextResponse.json(await fetchItems());
    }

    if (type === "builds") {
      const heroId = searchParams.get("heroId");
      if (!heroId) return NextResponse.json({ error: "heroId required" }, { status: 400 });
      const sortBy = searchParams.get("sortBy") === "favorites" ? "favorites" : "weekly_favorites";
      const data = await proxy(
        `${API}/builds?hero_id=${heroId}&sort_by=${sortBy}&sort_direction=desc&only_latest=true&limit=20`,
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
