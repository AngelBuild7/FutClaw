import "server-only";
import { redis } from "./redis";
import { fetchRepoSummary, type RepoSummary } from "./github/repo";
import { scoutCard } from "./scout";
import type { Card, Metric, Stats } from "./scoring/types";

export type SquadMember = {
  card: Card;
  contributions: number;
};

export type RepoClubResult = {
  summary: RepoSummary;
  squad: SquadMember[];
  clubCard: Card;
};

const CACHE_VERSION = "v1";
const REPO_CLUB_TTL_SECONDS = 60 * 60;
const LAST_GOOD_REPO_CLUB_TTL_SECONDS = 14 * 24 * 60 * 60;

const normalizeRepoPart = (value: string) => value.trim().toLowerCase();
const keyFor = (owner: string, repo: string) =>
  `futclaw:repo-club:${CACHE_VERSION}:${normalizeRepoPart(owner)}/${normalizeRepoPart(repo)}`;
const lastGoodKeyFor = (owner: string, repo: string) =>
  `futclaw:repo-club:${CACHE_VERSION}:last-good:${normalizeRepoPart(owner)}/${normalizeRepoPart(repo)}`;

function clampStat(value: number) {
  return Math.max(1, Math.min(99, Math.round(value)));
}

function finishFor(overall: number): Card["finish"] {
  if (overall >= 93) return "icon";
  if (overall >= 88) return "toty";
  if (overall >= 82) return "totw";
  if (overall >= 74) return "gold";
  if (overall >= 64) return "silver";
  return "bronze";
}

function finishLabelFor(finish: Card["finish"]) {
  if (finish === "toty") return "Elite Club";
  if (finish === "totw") return "In Form Club";
  if (finish === "icon") return "Icon Club";
  return `${finish[0].toUpperCase()}${finish.slice(1)} Club`;
}

function repoStats(summary: RepoSummary, squad: SquadMember[], average: number): Stats {
  const totalContributions = squad.reduce((total, member) => total + member.contributions, 0);
  return {
    pac: clampStat(Math.log10(summary.stars + 1) * 18 + 34),
    sho: clampStat(Math.log10(summary.forks + 1) * 20 + 30),
    pas: clampStat(average || 50),
    dri: clampStat(Math.min(squad.length, 11) * 7 + 20),
    def: clampStat(Math.log10(totalContributions + 1) * 18 + 30),
    phy: clampStat(Math.log10(summary.stars + summary.forks + totalContributions + 1) * 16 + 28),
  };
}

function repoMetrics(summary: RepoSummary, squad: SquadMember[], average: number): Metric[] {
  const totalContributions = squad.reduce((total, member) => total + member.contributions, 0);
  return [
    { label: "Stars", value: summary.stars, unit: "stars", score: clampStat(Math.log10(summary.stars + 1) * 18 + 34) },
    { label: "Forks", value: summary.forks, unit: "forks", score: clampStat(Math.log10(summary.forks + 1) * 20 + 30) },
    { label: "Squad", value: squad.length, unit: "contributors", score: clampStat(Math.min(squad.length, 11) * 7 + 20) },
    { label: "Contributions", value: totalContributions, unit: "commits", score: clampStat(Math.log10(totalContributions + 1) * 18 + 30) },
    { label: "Avg OVR", value: average, score: clampStat(average || 0) },
  ];
}

function buildClubCard(summary: RepoSummary, squad: SquadMember[]): Card {
  const average = squad.length
    ? Math.round(squad.reduce((total, member) => total + member.card.overall, 0) / squad.length)
    : 0;
  const overall = clampStat(average || Math.log10(summary.stars + summary.forks + 1) * 16 + 40);
  const finish = finishFor(overall);
  const stats = repoStats(summary, squad, overall);

  return {
    platform: "club",
    login: `${summary.owner}/${summary.repo}`.toLowerCase(),
    name: summary.fullName,
    avatarUrl: `https://github.com/${summary.owner}.png?size=460`,
    profile: {
      bio: summary.description,
      websiteUrl: summary.url,
      githubUrl: summary.url,
      repositories: [
        {
          name: summary.fullName,
          description: summary.description,
          url: summary.url,
          language: summary.language,
          stars: summary.stars,
        },
      ],
    },
    country: "",
    club: "futclaw",
    stats,
    position: "CM",
    family: "Playmaker",
    baseOVR: overall,
    overall,
    finish,
    finishLabel: finishLabelFor(finish),
    archetype: "Repo Club",
    archetypeBlurb: `A 4-3-3 contributor XI built from ${summary.fullName}.`,
    legacy: { L: Math.max(1, Math.min(5, Math.round(Math.log10(summary.stars + 1)))) },
    topLanguage: summary.language,
    languageLogo: null,
    report: {
      skillMoves: Math.max(1, Math.min(5, Math.ceil(squad.length / 3))),
      weakFoot: Math.max(1, Math.min(5, Math.ceil(Math.log10(summary.forks + 1)))),
      workRate: { attack: "High", defense: squad.length >= 8 ? "High" : "Med" },
      style: "Contributor XI",
      reasons: {
        skillMoves: "Scored from the number of scouted contributors in the lineup.",
        weakFoot: "Scored from fork activity around the repository.",
        workRate: "Based on contributor depth across the squad.",
        style: "RepoClub cards represent a repository squad, not one developer profile.",
      },
      playstyles: [],
      metrics: repoMetrics(summary, squad, overall),
    },
  };
}

async function readCacheKey(key: string): Promise<RepoClubResult | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    const cached = raw ? (JSON.parse(raw) as RepoClubResult) : null;
    return cached && cached.squad.length > 0 ? cached : null;
  } catch (e) {
    console.error("[repo-club] cache read failed:", (e as Error).message);
    return null;
  }
}

async function readCache(owner: string, repo: string): Promise<RepoClubResult | null> {
  return (await readCacheKey(keyFor(owner, repo))) ?? readCacheKey(lastGoodKeyFor(owner, repo));
}

async function readLastGoodCache(owner: string, repo: string): Promise<RepoClubResult | null> {
  return readCacheKey(lastGoodKeyFor(owner, repo));
}

async function writeCache(owner: string, repo: string, result: RepoClubResult): Promise<void> {
  if (!redis) return;
  try {
    const payload = JSON.stringify(result);
    await Promise.all([
      redis.set(keyFor(owner, repo), payload, "EX", REPO_CLUB_TTL_SECONDS),
      redis.set(lastGoodKeyFor(owner, repo), payload, "EX", LAST_GOOD_REPO_CLUB_TTL_SECONDS),
    ]);
  } catch (e) {
    console.error("[repo-club] cache write failed:", (e as Error).message);
  }
}

export async function buildRepoClub(owner: string, repo: string): Promise<RepoClubResult> {
  const cached = await readCache(owner, repo);
  if (cached) return cached;

  const summary = await fetchRepoSummary(owner, repo, 18).catch(async (e) => {
    const stale = await readLastGoodCache(owner, repo);
    if (stale) return stale.summary;
    throw e;
  });
  const settled = await Promise.allSettled(
    summary.contributors.map(async (contributor) => ({
      card: await scoutCard(contributor.login),
      contributions: contributor.contributions,
    })),
  );

  const squad = settled
    .filter((res): res is PromiseFulfilledResult<SquadMember> => res.status === "fulfilled")
    .map((res) => res.value)
    .slice(0, 11);
  if (squad.length === 0) {
    const stale = await readLastGoodCache(summary.owner, summary.repo);
    if (stale) return stale;
  }
  const result = { summary, squad, clubCard: buildClubCard(summary, squad) };
  if (squad.length > 0) {
    await writeCache(summary.owner, summary.repo, result);
  }
  return result;
}
