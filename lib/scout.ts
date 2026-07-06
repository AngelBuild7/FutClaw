import "server-only";
import { redis } from "./redis";
import { buildCard } from "./scoring/engine";
import { fetchProfile } from "./github/client";
import { signalsFromPayload } from "./github/signals";
import { SAMPLE_CARDS } from "./github/samples";
import { fetchProfile as fetchYouTubeProfile } from "./youtube/client";
import { signalsFromPayload as youtubeSignals } from "./youtube/signals";
import type { Card } from "./scoring/types";

// Read-through Redis cache for built cards — the single path every scout surface
// (the /<user> page, the JSON API, the OG image) uses to turn a username into a
// Card. A profile is fetched from GitHub + scored at most once per TTL; repeat
// views, link unfurls and README-embed regenerations are then served from Redis
// instead of each spending a handful of GitHub GraphQL calls. This is the app's
// highest-leverage perf + rate-limit safeguard.
//
// Best-effort throughout, mirroring lib/analytics + lib/redis: a missing
// REDIS_URL, a cache miss, an outage or a parse error all fall through to a live
// fetch — the cache only ever changes speed, never behaviour. Only successful
// builds are stored; scout errors (notfound / ratelimit / …) propagate unchanged
// and are never cached.

// Namespaced alongside futclaw:scouts:total. The version segment lets a deploy
// that changes buildCard's output shape or scoring invalidate every entry at
// once (bump it) instead of serving stale-shaped cards until their TTL lapses.
const CACHE_VERSION = "v2";
const CARD_TTL_SECONDS = 120 * 60; // 2h — GitHub stats move slowly; longer TTL = fewer refetches of hot profiles under load.
const LAST_GOOD_CARD_TTL_SECONDS = 14 * 24 * 60 * 60;

const normalizeLogin = (username: string) => username.trim().replace(/^@/, "").toLowerCase();
const keyFor = (platform: string, login: string) => `futclaw:card:${CACHE_VERSION}:${platform}:${login}`;
const lastGoodKeyFor = (platform: string, login: string) => `futclaw:card:${CACHE_VERSION}:last-good:${platform}:${login}`;

async function readCacheKey(key: string): Promise<Card | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as Card) : null;
  } catch (e) {
    console.error("[scout] cache read failed:", (e as Error).message);
    return null;
  }
}

async function readCache(platform: string, login: string): Promise<Card | null> {
  return readCacheKey(keyFor(platform, login));
}

async function readLastGoodCache(platform: string, login: string): Promise<Card | null> {
  return readCacheKey(lastGoodKeyFor(platform, login));
}

async function writeCache(platform: string, login: string, card: Card): Promise<void> {
  if (!redis) return;
  try {
    const payload = JSON.stringify(card);
    await Promise.all([
      redis.set(keyFor(platform, login), payload, "EX", CARD_TTL_SECONDS),
      redis.set(lastGoodKeyFor(platform, login), payload, "EX", LAST_GOOD_CARD_TTL_SECONDS),
    ]);
  } catch (e) {
    console.error("[scout] cache write failed:", (e as Error).message);
  }
}

// Single-flight: concurrent scouts of the same login collapse onto one in-flight
// build. The Redis cache takes a beat to populate (a profile fetch is a handful
// of GitHub calls), so when a profile trends every hit in that fill window would
// otherwise be a full cache miss — one GitHub fetch *per concurrent viewer*. This
// map coalesces them into a single fetch whose result they all share.
//
// Keyed by normalized login. Entries are deleted the moment the build settles
// (success or failure) so failures are never memoised — the next scout retries —
// and the map can't grow unbounded. Callers never mutate the returned Card (every
// surface spreads it: `{ ...card, country }`), so sharing one object is safe.
const inflight = new Map<string, Promise<Card>>();

async function buildFreshGitHub(username: string, login: string): Promise<Card> {
  const card = buildCard(signalsFromPayload(await fetchProfile(username)));
  await writeCache("github", login, card);
  return card;
}

async function buildFreshYouTube(username: string, login: string): Promise<Card> {
  const card = buildCard(youtubeSignals(await fetchYouTubeProfile(username)));
  await writeCache("youtube", login, card);
  return card;
}

// Username -> Card, Redis-cached. Throws the same GithubError as fetchProfile
// when the scout fails, so callers keep mapping it to a 404 page / error status /
// null OG exactly as before.
export async function scoutCard(username: string, platform: "github" | "youtube" = "github"): Promise<Card> {
  const login = normalizeLogin(username);

  if (platform === "youtube") {
    const cached = await readCache("youtube", login);
    if (cached) return cached;

    const existing = inflight.get(`youtube:${login}`);
    if (existing) return existing;

    const pending = buildFreshYouTube(username, login).catch(async (e) => {
      const stale = await readLastGoodCache("youtube", login);
      if (stale) return stale;
      throw e;
    }).finally(() => inflight.delete(`youtube:${login}`));
    inflight.set(`youtube:${login}`, pending);
    return pending;
  }

  // Tokenless demo: serve the in-memory sample cards by login so the home-fan
  // samples resolve (and the app stays explorable) without a GitHub token. They
  // already live in memory, so they bypass Redis entirely. Checks both env vars
  // so a pool-only deploy (GITHUB_TOKENS without GITHUB_TOKEN) scouts for real.
  if (!process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKENS) {
    const sample = SAMPLE_CARDS.find((c) => c.login.toLowerCase() === login);
    if (sample) return sample;
  }

  const cached = await readCache("github", login);
  if (cached) return cached;

  // Coalesce concurrent misses for this login onto one build (see `inflight`).
  const existing = inflight.get(`github:${login}`);
  if (existing) return existing;

  const pending = buildFreshGitHub(username, login).catch(async (e) => {
    const stale = await readLastGoodCache("github", login);
    if (stale) return stale;
    throw e;
  }).finally(() => inflight.delete(`github:${login}`));
  inflight.set(`github:${login}`, pending);
  return pending;
}
