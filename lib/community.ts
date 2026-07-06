import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { SAMPLE_CARDS } from "@/lib/github/samples";
import type { Card, Finish } from "@/lib/scoring/types";

type ScoutResultRow = {
  id: string;
  username: string;
  platform: "github" | "youtube" | string;
  card_data: Card;
  finish: string;
  overall: number;
  position: string | null;
  archetype: string | null;
  country_code: string | null;
  created_at: string | null;
};

const FINISH_TO_DB: Record<Finish, string> = {
  bronze: "bronze",
  silver: "silver",
  gold: "gold",
  totw: "inform",
  toty: "toty",
  icon: "icon",
  founder: "founder",
};

function normalizeCommunityUsername(username: string) {
  return username.trim().replace(/^@/, "").toLowerCase();
}

function createPublicCommunityClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function toScoutResultPayload(card: Card) {
  const platform = card.platform ?? "github";
  return {
    user_id: null,
    username: normalizeCommunityUsername(card.login),
    platform,
    card_data: card,
    signals_data: {},
    finish: FINISH_TO_DB[card.finish],
    overall: card.overall,
    position: card.position,
    archetype: card.archetype,
    country_code: card.country || null,
    expires_at: null,
  };
}

function cardFromRow(row: ScoutResultRow): Card {
  return {
    ...row.card_data,
    platform: (row.card_data.platform ?? row.platform ?? "github") as Card["platform"],
    login: normalizeCommunityUsername(row.card_data.login || row.username),
    overall: row.card_data.overall ?? row.overall,
  };
}

function uniqueCardsByLogin(cards: Card[], limit: number): Card[] {
  const seen = new Set<string>();
  const unique: Card[] = [];

  for (const card of cards) {
    const login = normalizeCommunityUsername(card.login);
    const platform = card.platform ?? "github";
    const key = `${platform}:${login}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...card, platform, login });
    if (unique.length >= limit) break;
  }

  return unique;
}

export async function recordGeneratedCard(card: Card): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  try {
    const payload = toScoutResultPayload(card);
    const { error } = await supabase
      .from("scout_results")
      .upsert(payload, { onConflict: "platform,username" });
    if (error) throw error;
  } catch (e) {
    console.error("[community] recordGeneratedCard failed:", (e as Error).message);
  }
}

export async function recordAnalyticsEvent(
  eventType: string,
  eventData: Record<string, unknown> = {},
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from("analytics_events").insert({
      user_id: null,
      event_type: eventType,
      event_data: eventData,
    });
    if (error) throw error;
  } catch (e) {
    console.error("[community] recordAnalyticsEvent failed:", (e as Error).message);
  }
}

export async function recordPublicScout(card: Card, source: string): Promise<void> {
  await Promise.all([
    recordGeneratedCard(card),
    recordAnalyticsEvent("card_generated", {
      source,
      username: card.login,
      platform: card.platform ?? "github",
      overall: card.overall,
      finish: card.finish,
      theme: card.customization?.theme ?? null,
    }),
  ]);
}

export async function recordRepoClub(card: Card, source: string): Promise<void> {
  await Promise.all([
    recordGeneratedCard(card),
    recordAnalyticsEvent("club_generated", {
      source,
      username: card.login,
      platform: "club",
      overall: card.overall,
      finish: card.finish,
      stars: card.report.metrics.find((metric) => metric.label === "Stars")?.value ?? null,
      forks: card.report.metrics.find((metric) => metric.label === "Forks")?.value ?? null,
      squad: card.report.metrics.find((metric) => metric.label === "Squad")?.value ?? null,
    }),
  ]);
}

export async function getRecentCommunityCards(limit = 12): Promise<Card[]> {
  try {
    const supabase = createPublicCommunityClient();
    if (!supabase) return uniqueCardsByLogin(SAMPLE_CARDS, limit);

    const { data, error } = await supabase
      .from("scout_results")
      .select("id, username, platform, card_data, finish, overall, position, archetype, country_code, created_at")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit * 4, 100));

    if (error) throw error;
    const cards = (data as ScoutResultRow[] | null)?.map(cardFromRow).filter(Boolean) ?? [];
    const uniqueCards = uniqueCardsByLogin(cards, limit);
    return uniqueCards.length > 0 ? uniqueCards : uniqueCardsByLogin(SAMPLE_CARDS, limit);
  } catch (e) {
    console.error("[community] getRecentCommunityCards failed:", (e as Error).message);
    return uniqueCardsByLogin(SAMPLE_CARDS, limit);
  }
}

export async function getTopCommunityCards(limit = 100): Promise<Card[]> {
  try {
    const supabase = createPublicCommunityClient();
    if (!supabase) return uniqueCardsByLogin(SAMPLE_CARDS, limit);

    const { data, error } = await supabase
      .from("scout_results")
      .select("id, username, platform, card_data, finish, overall, position, archetype, country_code, created_at")
      .order("overall", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(Math.min(limit * 2, 200));

    if (error) throw error;
    const cards = (data as ScoutResultRow[] | null)?.map(cardFromRow).filter(Boolean) ?? [];
    const uniqueCards = uniqueCardsByLogin(cards, limit);
    return uniqueCards.length > 0 ? uniqueCards : uniqueCardsByLogin(SAMPLE_CARDS, limit);
  } catch (e) {
    console.error("[community] getTopCommunityCards failed:", (e as Error).message);
    return uniqueCardsByLogin(SAMPLE_CARDS, limit);
  }
}

export async function getCommunityRank(username: string): Promise<number | null> {
  const normalizedUsername = normalizeCommunityUsername(username);
  const topCards = await getTopCommunityCards(200);
  const index = topCards.findIndex((card) => normalizeCommunityUsername(card.login) === normalizedUsername);
  return index >= 0 ? index + 1 : null;
}

export async function getCommunityCard(username: string, platform: "github" | "youtube" = "github"): Promise<Card | null> {
  const normalizedUsername = normalizeCommunityUsername(username);

  try {
    const supabase = createPublicCommunityClient();
    if (!supabase) return SAMPLE_CARDS.find((card) => normalizeCommunityUsername(card.login) === normalizedUsername) ?? null;

    const { data, error } = await supabase
      .from("scout_results")
      .select("id, username, platform, card_data, finish, overall, position, archetype, country_code, created_at")
      .eq("platform", platform)
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (error) throw error;
    if (data) return cardFromRow(data as ScoutResultRow);
  } catch (e) {
    console.error("[community] getCommunityCard failed:", (e as Error).message);
  }

  return SAMPLE_CARDS.find((card) => normalizeCommunityUsername(card.login) === normalizedUsername) ?? null;
}
