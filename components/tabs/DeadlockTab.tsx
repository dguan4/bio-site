"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, ChevronRight, Star, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DeadlockHero,
  DeadlockItem,
  DeadlockBuild,
  DeadlockMatchSummary,
  DeadlockMatchDetail,
} from "@/lib/types";

// Module-level cache so re-mounting never re-fetches
let _heroes: DeadlockHero[] | null = null;
let _items: DeadlockItem[] | null = null;

// ── Pure helpers ──────────────────────────────────────────────────────────────

function parseAccountId(input: string): string | null {
  const t = input.trim();
  if (/^\d{17}$/.test(t)) {
    return (BigInt(t) - BigInt("76561197960265728")).toString();
  }
  const urlMatch = t.match(/\/profiles\/(\d{17})/);
  if (urlMatch) {
    return (BigInt(urlMatch[1]) - BigInt("76561197960265728")).toString();
  }
  if (/^\d{1,12}$/.test(t)) return t;
  return null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getCategory(slotType: string | undefined): "weapon" | "vitality" | "spirit" | null {
  if (!slotType) return null;
  const t = slotType.toLowerCase();
  if (t === "weapon" || t.includes("weapon")) return "weapon";
  if (t === "vitality" || t.includes("armor")) return "vitality";
  if (t === "spirit" || t.includes("tech")) return "spirit";
  return null;
}

function describeBuild(itemIds: number[], itemMap: Map<number, DeadlockItem>): string[] {
  const counts = { weapon: 0, vitality: 0, spirit: 0 };
  for (const id of itemIds) {
    const cat = getCategory(itemMap.get(id)?.item_slot_type);
    if (cat) counts[cat]++;
  }
  const total = counts.weapon + counts.vitality + counts.spirit;
  if (total === 0) return [];

  const pct = { Weapon: counts.weapon / total, Spirit: counts.spirit / total, Vitality: counts.vitality / total };
  const sorted = (Object.entries(pct) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const [topName, topPct] = sorted[0];
  const [secondName, secondPct] = sorted[1];

  const tags: string[] = [];
  if (topPct >= 0.6) tags.push(`High ${topName}`);
  else if (topPct >= 0.45) tags.push(`${topName}-focused`);
  else if (topPct >= 0.35 && secondPct >= 0.28) tags.push(`${topName}/${secondName}`);
  else tags.push("Balanced");

  if (pct.Vitality < 0.12 && total >= 4) tags.push("Squishy");
  else if (pct.Vitality >= 0.38) tags.push("Tanky");

  return tags;
}

function resolveWin(match: DeadlockMatchSummary): boolean | null {
  if (match.won !== undefined) return match.won;
  if (match.match_result !== undefined && match.team !== undefined) {
    return match.match_result === match.team;
  }
  return null;
}

const CATEGORY_CLASS = {
  weapon: "border-orange-500/50 text-orange-400",
  vitality: "border-green-500/50 text-green-400",
  spirit: "border-purple-500/50 text-purple-400",
} as const;

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      title="Copy build ID"
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-mono"
    >
      {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
      {label}
    </button>
  );
}

// ── ItemGrid ──────────────────────────────────────────────────────────────────

function ItemGrid({ itemIds, itemMap }: { itemIds: number[]; itemMap: Map<number, DeadlockItem> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {itemIds.map((id, idx) => {
        const item = itemMap.get(id);
        if (!item) return null;
        const cat = getCategory(item.item_slot_type);
        const iconSrc = item.shop_image_webp ?? item.shop_image;
        return (
          <div
            key={`${id}-${idx}`}
            className={`flex flex-col items-center gap-1 rounded-md border px-2 py-1.5 text-[10px] ${cat ? CATEGORY_CLASS[cat] : "border-border text-foreground"}`}
          >
            {iconSrc && (
              <img
                src={iconSrc}
                alt=""
                className="size-8 object-contain"
                loading="lazy"
              />
            )}
            <span className="text-center leading-tight max-w-[64px]">{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── BuildCard ─────────────────────────────────────────────────────────────────

function BuildCard({
  build,
  itemMap,
}: {
  build: DeadlockBuild;
  itemMap: Map<number, DeadlockItem>;
}) {
  const [open, setOpen] = useState(false);
  const hb = build.hero_build;

  // Collect all item IDs across all mod_categories (core + optional)
  const allItemIds = hb.details.mod_categories.flatMap((cat) =>
    cat.mods.map((m) => m.ability_id)
  );
  const coreItemIds = hb.details.mod_categories
    .filter((cat) => !cat.optional)
    .flatMap((cat) => cat.mods.map((m) => m.ability_id));

  const tags = itemMap.size > 0 ? describeBuild(coreItemIds.length > 0 ? coreItemIds : allItemIds, itemMap) : [];

  return (
    <Card className="border-border/50">
      <CardContent className="pt-3 pb-3 px-4 space-y-2">
        {/* Header row */}
        <button
          className="w-full flex items-start justify-between gap-3 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{hb.name}</span>
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] py-0">
                  {t}
                </Badge>
              ))}
            </div>
            {hb.description && hb.description.trim().length > 3 && (
              <p className="text-xs text-muted-foreground line-clamp-1">{hb.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <CopyButton value={String(hb.hero_build_id)} label={`#${hb.hero_build_id}`} />
            {build.num_weekly_favorites > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3" />
                {build.num_weekly_favorites.toLocaleString()}
              </span>
            )}
            {open ? (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded: items by section */}
        {open && itemMap.size > 0 && (
          <div className="pt-1 space-y-3">
            {hb.details.mod_categories.map((section, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.name}
                  </span>
                  {section.optional && (
                    <span className="text-[10px] text-muted-foreground/60">(optional)</span>
                  )}
                </div>
                <ItemGrid
                  itemIds={section.mods.map((m) => m.ability_id)}
                  itemMap={itemMap}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── DeadlockTab ───────────────────────────────────────────────────────────────

export default function DeadlockTab() {
  const [heroMap, setHeroMap] = useState<Map<number, DeadlockHero>>(new Map());
  const [itemMap, setItemMap] = useState<Map<number, DeadlockItem>>(new Map());
  const [heroList, setHeroList] = useState<DeadlockHero[]>([]);

  // Match history
  const [steamInput, setSteamInput] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [matches, setMatches] = useState<DeadlockMatchSummary[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [heroFilter, setHeroFilter] = useState<number | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);
  const [matchDetails, setMatchDetails] = useState<Map<number, DeadlockMatchDetail>>(new Map());
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);

  // Hero builds
  const [heroSearch, setHeroSearch] = useState("");
  const [selectedHero, setSelectedHero] = useState<DeadlockHero | null>(null);
  const [builds, setBuilds] = useState<DeadlockBuild[]>([]);
  const [buildsLoading, setBuildsLoading] = useState(false);
  const [buildsError, setBuildsError] = useState<string | null>(null);

  // Load reference data once
  useEffect(() => {
    if (_heroes) {
      const playable = _heroes.filter((h) => h.player_selectable && !h.disabled);
      setHeroMap(new Map(_heroes.map((h) => [h.id, h])));
      setHeroList(playable);
    } else {
      fetch("/api/deadlock?type=heroes")
        .then((r) => r.json())
        .then((data: DeadlockHero[]) => {
          _heroes = Array.isArray(data) ? data : [];
          const playable = _heroes.filter((h) => h.player_selectable && !h.disabled);
          setHeroMap(new Map(_heroes.map((h) => [h.id, h])));
          setHeroList(playable);
        })
        .catch(() => {});
    }

    if (_items) {
      setItemMap(new Map(_items.map((i) => [i.id, i])));
    } else {
      fetch("/api/deadlock?type=items")
        .then((r) => r.json())
        .then((data: DeadlockItem[]) => {
          _items = (Array.isArray(data) ? data : []).filter((i) => i.type === "upgrade");
          setItemMap(new Map(_items.map((i) => [i.id, i])));
        })
        .catch(() => {});
    }
  }, []);

  // ── Match History handlers ────────────────────────────────────────────────

  const searchMatches = useCallback(async () => {
    const aid = parseAccountId(steamInput);
    if (!aid) {
      setMatchesError("Enter a Steam ID (17 digits starting 7656119), profile URL, or account ID.");
      return;
    }
    setAccountId(aid);
    setMatchesLoading(true);
    setMatchesError(null);
    setMatches([]);
    setHeroFilter(null);
    setExpandedMatchId(null);

    try {
      const res = await fetch(`/api/deadlock?type=matches&accountId=${aid}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setMatches(Array.isArray(data) ? data : (data.matches ?? []));
    } catch (err) {
      setMatchesError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setMatchesLoading(false);
    }
  }, [steamInput]);

  const toggleMatch = useCallback(
    async (matchId: number) => {
      if (expandedMatchId === matchId) { setExpandedMatchId(null); return; }
      setExpandedMatchId(matchId);
      if (matchDetails.has(matchId)) return;

      setDetailLoadingId(matchId);
      try {
        const res = await fetch(`/api/deadlock?type=match&matchId=${matchId}`);
        const data = await res.json();
        if (res.ok) setMatchDetails((prev) => new Map(prev).set(matchId, data as DeadlockMatchDetail));
      } finally {
        setDetailLoadingId(null);
      }
    },
    [expandedMatchId, matchDetails]
  );

  // ── Hero Builds handlers ──────────────────────────────────────────────────

  const fetchBuilds = useCallback(async (hero: DeadlockHero) => {
    setSelectedHero(hero);
    setBuildsLoading(true);
    setBuildsError(null);
    setBuilds([]);

    try {
      const res = await fetch(`/api/deadlock?type=builds&heroId=${hero.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setBuilds(Array.isArray(data) ? data : []);
    } catch (err) {
      setBuildsError(err instanceof Error ? err.message : "Failed to load builds");
    } finally {
      setBuildsLoading(false);
    }
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const getHeroName = useCallback(
    (id: number) => heroMap.get(id)?.name ?? `Hero ${id}`,
    [heroMap]
  );

  const filteredMatches = heroFilter ? matches.filter((m) => m.hero_id === heroFilter) : matches;
  const heroesInHistory = Array.from(new Set(matches.map((m) => m.hero_id)))
    .map((id) => ({ id, name: getHeroName(id) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredHeroList = heroList
    .filter((h) => !heroSearch || h.name.toLowerCase().includes(heroSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  function getPlayerItems(matchId: number): DeadlockItem[] {
    const detail = matchDetails.get(matchId);
    if (!detail || !accountId) return [];
    const aid = parseInt(accountId, 10);
    const player = detail.players.find((p) => p.account_id === aid);
    return (player?.items ?? []).flatMap((id) => itemMap.get(id) ?? []);
  }

  function getPlayerBuildTags(matchId: number): string[] {
    const detail = matchDetails.get(matchId);
    if (!detail || !accountId || itemMap.size === 0) return [];
    const aid = parseInt(accountId, 10);
    const player = detail.players.find((p) => p.account_id === aid);
    if (!player?.items?.length) return [];
    return describeBuild(player.items, itemMap);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ── Match History ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Match History
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={steamInput}
            onChange={(e) => setSteamInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchMatches()}
            placeholder="Steam ID (76561198…) or account ID"
            className="flex-1 h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <Button onClick={searchMatches} disabled={matchesLoading || !steamInput.trim()}>
            <Search />
            Search
          </Button>
        </div>

        {matchesError && <p className="text-sm text-destructive">{matchesError}</p>}

        {matchesLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        )}

        {matches.length > 0 && (
          <>
            {heroesInHistory.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                <Button variant={heroFilter === null ? "default" : "outline"} size="xs" onClick={() => setHeroFilter(null)}>
                  All
                </Button>
                {heroesInHistory.map((h) => (
                  <Button
                    key={h.id}
                    variant={heroFilter === h.id ? "default" : "outline"}
                    size="xs"
                    onClick={() => setHeroFilter(heroFilter === h.id ? null : h.id)}
                  >
                    {h.name}
                  </Button>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              {filteredMatches.map((match) => {
                const win = resolveWin(match);
                const isExpanded = expandedMatchId === match.match_id;
                const isLoadingDetail = detailLoadingId === match.match_id;
                const items = isExpanded ? getPlayerItems(match.match_id) : [];
                const buildTags = isExpanded ? getPlayerBuildTags(match.match_id) : [];

                return (
                  <Card
                    key={match.match_id}
                    className={`cursor-pointer transition-colors hover:border-border border-border/50 ${
                      win === true ? "border-l-[3px] border-l-green-500"
                      : win === false ? "border-l-[3px] border-l-red-500"
                      : ""
                    }`}
                    onClick={() => toggleMatch(match.match_id)}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {win !== null && (
                            <span className={`text-xs font-bold w-4 shrink-0 ${win ? "text-green-500" : "text-red-500"}`}>
                              {win ? "W" : "L"}
                            </span>
                          )}
                          <span className="font-medium text-sm truncate">{getHeroName(match.hero_id)}</span>
                          {match.kills !== undefined && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {match.kills}/{match.deaths ?? "?"}/{match.assists ?? "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          {match.duration_s !== undefined && (
                            <span className="text-xs text-muted-foreground">{formatDuration(match.duration_s)}</span>
                          )}
                          {match.start_time !== undefined && (
                            <span className="hidden sm:inline text-xs text-muted-foreground">{formatDate(match.start_time)}</span>
                          )}
                          {isExpanded
                            ? <ChevronDown className="size-3.5 text-muted-foreground" />
                            : <ChevronRight className="size-3.5 text-muted-foreground" />
                          }
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2" onClick={(e) => e.stopPropagation()}>
                          {isLoadingDetail ? (
                            <Skeleton className="h-12 w-full" />
                          ) : items.length > 0 ? (
                            <>
                              {buildTags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {buildTags.map((t) => (
                                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                  ))}
                                </div>
                              )}
                              <ItemGrid itemIds={items.map((i) => i.id)} itemMap={itemMap} />
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {matchDetails.has(match.match_id) ? "No item data for this match." : "Loading details…"}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </section>

      <Separator />

      {/* ── Hero Builds ───────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Hero Builds
          </h2>
          <p className="text-xs text-muted-foreground">
            Pick a hero to see the top community builds this week.
          </p>
        </div>

        {/* Hero search + grid */}
        <div className="space-y-2">
          <input
            type="text"
            value={heroSearch}
            onChange={(e) => setHeroSearch(e.target.value)}
            placeholder="Filter heroes…"
            className="w-full h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />

          {heroList.length === 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-7 w-20" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filteredHeroList.map((hero) => (
                <Button
                  key={hero.id}
                  variant={selectedHero?.id === hero.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => fetchBuilds(hero)}
                  disabled={buildsLoading}
                >
                  {hero.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {buildsError && <p className="text-sm text-destructive">{buildsError}</p>}

        {buildsLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        )}

        {selectedHero && !buildsLoading && builds.length === 0 && !buildsError && (
          <p className="text-sm text-muted-foreground">No builds found for {selectedHero.name}.</p>
        )}

        {builds.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Top {builds.length} builds for {selectedHero?.name} — click to expand items
            </p>
            {builds.map((b) => (
              <BuildCard key={b.hero_build.hero_build_id} build={b} itemMap={itemMap} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
