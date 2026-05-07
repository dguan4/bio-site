// ── Profile (profile.json) ────────────────────────────────────────────────────

export interface SocialLink {
  platform: string;
  url: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  start: string;   // "YYYY-MM"
  end: string;     // "YYYY-MM" | "present"
  description: string;
  logo?: string;
}

export interface ProjectOverride {
  name: string;
  description: string;
  url: string;
  github?: string;
  tags?: string[];
  featured?: boolean;
}

export interface Profile {
  name: string;
  title: string;
  avatar?: string;
  bio: string;
  location?: string;
  email?: string;
  skills: string[];
  social: SocialLink[];
  experience: WorkExperience[];
  projectOverrides: ProjectOverride[];
}

// ── GitHub REST API ───────────────────────────────────────────────────────────

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  fork: boolean;
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: {
    name: string;
    url: string;
  };
  payload: {
    commits?: Array<{ message: string; sha: string }>;
    action?: string;
    ref?: string;
    ref_type?: string;
    pull_request?: { title: string; number: number };
    issue?: { title: string; number: number };
    release?: { tag_name: string };
  };
}

// ── Processed GitHub data ─────────────────────────────────────────────────────

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubStats {
  totalStars: number;
  totalForks: number;
  estimatedCommits: number;
  followers: number;
  publicRepos: number;
}

export interface GitHubData {
  user: GitHubUser;
  repos: GitHubRepo[];
  topRepos: GitHubRepo[];
  events: GitHubEvent[];
  contributions: ContributionDay[];
  languages: Record<string, number>;
  stats: GitHubStats;
  cachedAt: number;
  contributionsFromToken: boolean;
}

// ── Deadlock ──────────────────────────────────────────────────────────────────

// assets.deadlock-api.com/v2/heroes
export interface DeadlockHero {
  id: number;
  name: string;       // English display name, e.g. "Infernus"
  class_name: string; // e.g. "hero_infernus"
  player_selectable: boolean;
  disabled: boolean;
  in_development: boolean;
  images?: {
    icon_image_small?: string;
    icon_hero_card?: string;
    [key: string]: string | undefined;
  };
}

// assets.deadlock-api.com/v2/items
export interface DeadlockItem {
  id: number;        // large 32-bit int; matches ability_id in builds
  name: string;      // English display name, e.g. "Headshot Booster"
  class_name: string;
  type: string;      // "upgrade" = shop item, "ability", "weapon"
  item_slot_type: "weapon" | "vitality" | "spirit" | string;
  item_tier?: number;
  cost?: number;
  shop_image?: string;
  shop_image_webp?: string;
}

// api.deadlock-api.com/v1/builds
export interface DeadlockBuildMod {
  ability_id: number;
  annotation: string | null;
}

export interface DeadlockBuildCategory {
  name: string;
  description: string;
  optional: boolean | null;
  mods: DeadlockBuildMod[];
}

export interface DeadlockBuild {
  hero_build: {
    hero_id: number;
    hero_build_id: number;
    author_account_id: number;
    last_updated_timestamp: number;
    name: string;
    description: string;
    version: number;
    details: {
      mod_categories: DeadlockBuildCategory[];
    };
  };
  num_favorites: number | null;
  num_weekly_favorites: number;
}

export interface DeadlockMatchSummary {
  match_id: number;
  hero_id: number;
  team?: number;
  match_result?: number;
  won?: boolean;
  kills?: number;
  deaths?: number;
  assists?: number;
  start_time?: number;
  duration_s?: number;
  net_worth?: number;
}

export interface DeadlockMatchPlayer {
  account_id: number;
  hero_id: number;
  team?: number;
  match_result?: number;
  won?: boolean;
  kills?: number;
  deaths?: number;
  assists?: number;
  items?: number[];
  net_worth?: number;
}

export interface DeadlockMatchDetail {
  match_id: number;
  start_time?: number;
  duration_s?: number;
  players: DeadlockMatchPlayer[];
}
