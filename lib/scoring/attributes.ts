import { formatCount } from "../format";
import { STATS } from "./constants";
import type { Metric, Signals, Stats, WorkRateLevel } from "./types";

// FUT-style attributes derived purely from real platform signals — no estimation.
// Each deriver returns its value plus a short, plain reason for the UI tooltip.

const Lg = (x: number) => Math.log10(Math.max(0, x) + 1);
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

const isYouTube = (s: Signals) => s.subscribers !== undefined && s.video_count !== undefined;

// A real platform value mapped to 0–99, log-scaled against an "elite" reference.
const score99 = (value: number, ref: number) =>
  value <= 0 ? 0 : clamp(Math.round(99 * (Lg(value) / Lg(ref))), 1, 99);

// Skill moves (1–5) = technical range: language diversity, +1 for broad output.
export function deriveSkillMoves(s: Signals): { value: number; reason: string } {
  if (isYouTube(s)) {
    const categories = s.category_count ?? s.languages;
    let value = categories >= 8 ? 5 : categories >= 6 ? 4 : categories >= 3 ? 3 : categories >= 2 ? 2 : 1;
    const bonus = (s.video_count ?? 0) >= 150 && value < 5;
    if (bonus) value += 1;
    return {
      value,
      reason: `Content range: ${categories} categor${categories === 1 ? "y" : "ies"}${
        bonus ? ` across ${formatCount(s.video_count ?? 0)} videos` : ""
      }.`,
    };
  }

  let value = s.languages >= 10 ? 5 : s.languages >= 7 ? 4 : s.languages >= 4 ? 3 : s.languages >= 2 ? 2 : 1;
  const bonus = s.public_repos >= 40 && value < 5;
  if (bonus) value += 1;
  const reason = `Technical range: ${s.languages} language${s.languages === 1 ? "" : "s"}${
    bonus ? ` across ${formatCount(s.public_repos)} repos` : ""
  }.`;
  return { value, reason };
}

// Weak foot (1–5) = off-foot ability: how strong your WEAKER areas are (average
// of the three lowest stats), so a one-trick profile rates low.
export function deriveWeakFoot(stats: Stats): { value: number; reason: string } {
  const sorted = STATS.map((k) => stats[k]).sort((a, b) => a - b);
  const weakSide = Math.round((sorted[0] + sorted[1] + sorted[2]) / 3);
  const value = weakSide >= 72 ? 5 : weakSide >= 63 ? 4 : weakSide >= 54 ? 3 : weakSide >= 45 ? 2 : 1;
  return { value, reason: `Off-foot: your three weakest stats average ${weakSide}/99.` };
}

const rate = (v: number): WorkRateLevel => (v >= 68 ? "High" : v >= 50 ? "Med" : "Low");

// Work rate: attack = shipping output (PAC/SHO), defense = maintenance (DEF).
export function deriveWorkRate(stats: Stats): { attack: WorkRateLevel; defense: WorkRateLevel; reason: string } {
  const attack = rate(Math.round((stats.pac + stats.sho) / 2));
  const defense = rate(stats.def);
  return {
    attack,
    defense,
    reason: `Attack ${attack} from output and reach; defense ${defense} from engagement quality.`,
  };
}

// Style: a one-word read of the recent activity pattern.
export function deriveStyle(s: Signals): { value: string; reason: string } {
  if (isYouTube(s)) {
    if (s.recent_spike) return { value: "Explosive", reason: "Recent videos are well above the channel baseline." };
    if ((s.recent_uploads ?? 0) >= 40) return { value: "Relentless", reason: "Uploads stayed active across the last year." };
    if ((s.channel_age_years ?? s.account_age_years) >= 6 && s.active_years >= 5)
      return { value: "Controlled", reason: "A long, steady channel track record." };
    if ((s.avg_views_recent ?? 0) >= 100_000 && (s.recent_uploads ?? 0) < 8)
      return { value: "Clinical", reason: "Fewer uploads, but each one lands." };
    if ((s.recent_uploads ?? 0) >= 12) return { value: "Industrious", reason: "Steadily uploading this year." };
    return { value: "Measured", reason: "Light recent upload activity." };
  }

  if (s.recent_spike) return { value: "Explosive", reason: "A recent burst well above your usual pace." };
  if (s.active_days_recent >= 200 && s.recent_contributions >= 800)
    return { value: "Relentless", reason: "Active on most days, all year round." };
  if (s.account_age_years >= 6 && s.active_years >= 5)
    return { value: "Controlled", reason: "A long, steady track record." };
  if (s.max_repo_stars >= 5000 && s.recent_contributions < 200)
    return { value: "Clinical", reason: "One big hit, quiet lately." };
  if (s.recent_contributions >= 300) return { value: "Industrious", reason: "Steadily active this year." };
  return { value: "Measured", reason: "Light recent activity." };
}

interface MetricDef {
  label: string;
  unit: string;
  ref: number; // value that maps to ~99
  value: (s: Signals) => number;
}

// Core metrics — always shown (a few zeros are fine).
const CORE_METRICS: MetricDef[] = [
  { label: "Commits", unit: "commits", ref: 3_000, value: (s) => s.recent_commits },
  { label: "Stars earned", unit: "stars", ref: 200_000, value: (s) => s.total_stars_owned },
  { label: "Top repo reach", unit: "stars", ref: 150_000, value: (s) => s.max_repo_stars },
  { label: "Pull requests", unit: "PRs", ref: 2_000, value: (s) => s.prs_to_others },
  { label: "Followers", unit: "followers", ref: 100_000, value: (s) => s.followers },
  { label: "Languages", unit: "languages", ref: 15, value: (s) => s.languages },
  { label: "Issues", unit: "issues", ref: 1_500, value: (s) => s.issues_closed },
  { label: "Code reviews", unit: "reviews", ref: 2_000, value: (s) => s.reviews },
  { label: "Contributions", unit: "contributions", ref: 50_000, value: (s) => s.total_contributions_lifetime },
];

const YOUTUBE_CORE_METRICS: MetricDef[] = [
  { label: "Subscribers", unit: "subs", ref: 10_000_000, value: (s) => s.subscribers ?? 0 },
  { label: "Total views", unit: "views", ref: 1_000_000_000, value: (s) => s.total_views ?? 0 },
  { label: "Recent avg views", unit: "views", ref: 5_000_000, value: (s) => s.avg_views_recent ?? 0 },
  { label: "Videos", unit: "videos", ref: 2_000, value: (s) => s.video_count ?? 0 },
  { label: "Uploads this year", unit: "uploads", ref: 120, value: (s) => s.recent_uploads ?? 0 },
  { label: "Avg likes", unit: "likes", ref: 500_000, value: (s) => s.avg_likes_recent ?? 0 },
  { label: "Avg comments", unit: "comments", ref: 50_000, value: (s) => s.avg_comments_recent ?? 0 },
  { label: "Categories", unit: "categories", ref: 10, value: (s) => s.category_count ?? 0 },
];

// Optional metrics — appended only to make up for zeroed core ones (see below).
// Display-only, like the core metrics: they don't feed playstyles or attributes.
const OPTIONAL_METRICS: MetricDef[] = [
  { label: "Account age", unit: "yrs", ref: 15, value: (s) => Math.round(s.account_age_years) },
  { label: "Active days", unit: "days", ref: 365, value: (s) => s.active_days_recent },
  { label: "Repositories", unit: "repos", ref: 200, value: (s) => s.public_repos },
  { label: "Active years", unit: "yrs", ref: 15, value: (s) => s.active_years },
];

const YOUTUBE_OPTIONAL_METRICS: MetricDef[] = [
  { label: "Channel age", unit: "yrs", ref: 15, value: (s) => Math.round(s.channel_age_years ?? s.account_age_years) },
  { label: "Active years", unit: "yrs", ref: 15, value: (s) => s.active_years },
];

const toMetric = (def: MetricDef, s: Signals): Metric => {
  const value = def.value(s);
  return { label: def.label, value, unit: def.unit, score: score99(value, def.ref) };
};

// Detail metrics: the core bars with any ZEROED ones hidden, plus one optional
// (non-zero) filler for every zeroed core metric beyond the first — so a sparse
// profile shows real data (age, active days, repos…) instead of zeros.
export function deriveMetrics(s: Signals): Metric[] {
  const coreDefs = isYouTube(s) ? YOUTUBE_CORE_METRICS : CORE_METRICS;
  const optionalDefs = isYouTube(s) ? YOUTUBE_OPTIONAL_METRICS : OPTIONAL_METRICS;
  const core = coreDefs.map((d) => toMetric(d, s));
  const shown = core.filter((m) => m.value > 0); // hide zeroed core metrics
  const fillerCount = Math.max(0, core.length - shown.length - 1);
  const fillers = optionalDefs.map((d) => toMetric(d, s))
    .filter((m) => m.value > 0)
    .slice(0, fillerCount);
  return [...shown, ...fillers];
}
