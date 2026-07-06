"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  GitFork,
  Grid2X2,
  List,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import PlayerCard from "@/components/card/PlayerCard";
import { cn } from "@/lib/utils";
import { useFutClawTheme } from "@/lib/useFutClawTheme";
import type { Card, Finish, Position } from "@/lib/scoring/types";

type CommunityVariant = "light" | "dark";
type ViewMode = "grid" | "list";
type SortMode = "latest" | "top";
type PositionFilter = "all" | Position;
type SectionFilter = "all" | "github" | "club" | "youtube";

const POSITION_FILTERS: PositionFilter[] = ["all", "ST", "RW", "CAM", "CM", "CDM", "CB"];
const SECTION_FILTERS: { id: SectionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "github", label: "GitHub" },
  { id: "club", label: "Club" },
  { id: "youtube", label: "YouTube" },
];

const FINISH_LABEL: Record<Finish, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  totw: "Galactico",
  toty: "Elite",
  icon: "Galactico",
  founder: "Founder",
};

const VARIANTS = {
  light: {
    page: "bg-[#fafafa] text-[#171717]",
    subtleGrid: "community-grid-light",
    eyebrow: "text-[#4d4d4d]",
    muted: "text-[#7d7d7d]",
    soft: "text-[#4d4d4d]",
    panel: "border-[#00000014] bg-white",
    panelHover: "hover:border-[#00000036] hover:shadow-[0_8px_30px_-18px_rgba(0,0,0,0.35)]",
    control: "border-[#00000015] bg-white text-[#171717] hover:bg-[#fafafa]",
    controlMuted: "border-[#00000015] bg-white text-[#4d4d4d]",
    selected: "border-[#00000036] bg-[#f2f2f2] text-[#171717]",
    beta: "border-[#00000015] bg-[#fafafa] text-[#7d7d7d]",
    input: "border-[#00000015] bg-white text-[#171717] placeholder:text-[#8f8f8f]",
    cardStage: "bg-[#f5f5f5]",
    divider: "border-[#00000015]",
    badge: {
      bronze: "text-[#aa4d00]",
      silver: "text-[#4d4d4d]",
      gold: "text-[#aa4d00]",
      totw: "text-[#006bff]",
      toty: "text-[#fc0035]",
      icon: "text-[#006bff]",
      founder: "text-[#fc0035]",
    },
  },
  dark: {
    page: "bg-[#000000] text-[#ededed]",
    subtleGrid: "community-grid-dark",
    eyebrow: "text-[#a0a0a0]",
    muted: "text-[#878787]",
    soft: "text-[#a0a0a0]",
    panel: "border-[#ffffff17] bg-[#0a0a0a]",
    panelHover: "hover:border-[#ffffff3d] hover:bg-[#111111]",
    control: "border-[#ffffff17] bg-[#0a0a0a] text-[#ededed] hover:bg-[#1a1a1a]",
    controlMuted: "border-[#ffffff17] bg-[#0a0a0a] text-[#a0a0a0]",
    selected: "border-[#ffffff3d] bg-[#1f1f1f] text-[#ededed]",
    beta: "border-[#ffffff17] bg-white/[0.035] text-[#878787]",
    input: "border-[#ffffff17] bg-[#0a0a0a] text-[#ededed] placeholder:text-[#878787]",
    cardStage: "bg-black",
    divider: "border-[#ffffff17]",
    badge: {
      bronze: "text-[#ff9300]",
      silver: "text-[#a0a0a0]",
      gold: "text-[#ffae00]",
      totw: "text-[#47a8ff]",
      toty: "text-[#ff565f]",
      icon: "text-[#47a8ff]",
      founder: "text-[#ff565f]",
    },
  },
} as const;

function finishLabel(card: Card) {
  return card.finishLabel || FINISH_LABEL[card.finish];
}

function searchCard(card: Card, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [card.name, card.login, card.archetype, card.topLanguage, card.languageLogo?.name]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

function metricValue(card: Card, label: string) {
  return card.report.metrics.find((metric) => metric.label === label)?.value ?? 0;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function topSortValue(card: Card, sectionFilter: SectionFilter) {
  if (sectionFilter === "club" && cardSection(card) === "club") {
    return metricValue(card, "Contributions");
  }
  return card.overall;
}

function sortCards(cards: Card[], sortMode: SortMode, sectionFilter: SectionFilter) {
  if (sortMode === "latest") return cards;
  return [...cards].sort((a, b) => topSortValue(b, sectionFilter) - topSortValue(a, sectionFilter) || a.name.localeCompare(b.name));
}

function cardSection(card: Card): Exclude<SectionFilter, "all"> {
  const platform = String(card.platform ?? "github").toLowerCase();
  if (platform === "youtube") return "youtube";
  if (platform === "club" || platform === "repo") return "club";
  return "github";
}

function clubHref(card: Card) {
  const login = card.login.trim().replace(/^@/, "");
  const [owner, repo] = login.split("/").filter(Boolean);
  if (owner && repo) return `/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  return `/community/${encodeURIComponent(card.login)}`;
}

function repoOwner(card: Card) {
  return card.login.split("/")[0] || card.login;
}

function ClubPreview({
  card,
  variant,
  compact = false,
}: {
  card: Card;
  variant: typeof VARIANTS[CommunityVariant];
  compact?: boolean;
}) {
  const stars = metricValue(card, "Stars");
  const forks = metricValue(card, "Forks");
  const squad = metricValue(card, "Squad");
  const contributions = metricValue(card, "Contributions");
  const owner = repoOwner(card);
  const ownerAvatar = `https://github.com/${owner}.png?size=160`;

  if (compact) {
    return (
      <div className="relative flex h-[70px] w-full items-center justify-center overflow-hidden rounded-[6px] border border-[#d4af37]/25 bg-black">
        <img src="/repo-club/pitch-points.png" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <img
          src={ownerAvatar}
          alt=""
          className="relative size-9 rounded-full border border-[#d4af37]/50 bg-black object-cover"
          onError={(event) => {
            event.currentTarget.src = card.avatarUrl;
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[6px] border border-[#d4af37]/25 bg-black">
      <img
        src="/repo-club/pitch-points.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-200 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.76))]" />
      <div className="relative flex h-full flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1 rounded-full border border-[#d4af37]/35 bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f1cf7a]">
              <GitFork className="size-3" />
              RepoClub
            </div>
            <p className="mt-2 truncate text-[17px] font-black leading-none text-white">{card.login}</p>
            <p className="mt-1 truncate text-[11px] text-white/62">{card.topLanguage ?? "Mixed stack"} · Starting XI</p>
          </div>
          <img
            src={ownerAvatar}
            alt={`${owner} avatar`}
            className="size-11 shrink-0 rounded-full border border-[#d4af37]/55 bg-black object-cover shadow-[0_8px_22px_rgba(0,0,0,.45)]"
            onError={(event) => {
              event.currentTarget.src = card.avatarUrl;
            }}
          />
        </div>

        <div className="grid grid-cols-4 overflow-hidden rounded-[6px] border border-white/12 bg-black/72">
          {[
            { label: "Stars", value: formatCompact(stars), icon: Star },
            { label: "Forks", value: formatCompact(forks), icon: GitFork },
            { label: "XI", value: String(squad || 0), icon: Users },
            { label: "Commits", value: formatCompact(contributions), icon: ShieldCheck },
          ].map((item, index) => (
            <div key={item.label} className={cn("px-2 py-2 text-center", index > 0 && "border-l border-white/10")}>
              <item.icon className="mx-auto size-3 text-[#d4af37]" />
              <p className="mt-1 text-[13px] font-black leading-none tabular-nums text-white">{item.value}</p>
              <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.08em] text-white/45">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
      <span className={cn("absolute bottom-2 right-2 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase", variant.beta)}>
        club
      </span>
    </div>
  );
}

function CardTile({
  card,
  index,
  variant,
  href,
}: {
  card: Card;
  index: number;
  variant: typeof VARIANTS[CommunityVariant];
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[306px] flex-col overflow-hidden rounded-[8px] border p-3 transition",
        variant.panel,
        variant.panelHover,
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("font-mono text-[11px] font-semibold", variant.muted)}>
          #{String(index + 1).padStart(2, "0")}
        </span>
        <MoreHorizontal className={cn("size-4", variant.muted)} />
      </div>

      <div className={cn("mt-2 flex h-[154px] items-center justify-center rounded-[6px]", variant.cardStage)}>
        {cardSection(card) === "club" ? (
          <ClubPreview card={card} variant={variant} />
        ) : (
          <div className="w-[104px] transition duration-200 group-hover:scale-[1.04]">
            <PlayerCard card={card} />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{cardSection(card) === "club" ? card.login : card.name}</p>
          <p className={cn("truncate text-xs", variant.muted)}>
            {cardSection(card) === "club" ? `${formatCompact(metricValue(card, "Contributions"))} XI commits` : `@${card.login}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-semibold leading-none">{card.overall}</p>
          <p className={cn("mt-1 font-mono text-[10px] uppercase", variant.muted)}>OVR</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <ShieldCheck className={cn("size-3.5", variant.badge[card.finish])} />
        <span className={cn("truncate text-xs font-medium", variant.badge[card.finish])}>
          {finishLabel(card)}
        </span>
        <span className={cn("ml-auto rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase", variant.beta)}>
          {cardSection(card)}
        </span>
      </div>
    </Link>
  );
}

function CardRow({
  card,
  index,
  variant,
  href,
}: {
  card: Card;
  index: number;
  variant: typeof VARIANTS[CommunityVariant];
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "grid grid-cols-[44px_64px_minmax(0,1fr)_72px_72px] items-center gap-3 border-b px-3 py-3 text-sm transition last:border-b-0 md:grid-cols-[44px_64px_minmax(0,1fr)_72px_72px_72px]",
        variant.divider,
        variant.panelHover,
      )}
    >
      <span className={cn("font-mono text-[11px] font-semibold", variant.muted)}>
        #{String(index + 1).padStart(2, "0")}
      </span>
      <div className={cn("flex h-[70px] items-center justify-center rounded-[6px]", variant.cardStage)}>
        {cardSection(card) === "club" ? (
          <ClubPreview card={card} variant={variant} compact />
        ) : (
          <div className="w-[42px]">
            <PlayerCard card={card} />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold">{cardSection(card) === "club" ? card.login : card.name}</p>
        <p className={cn("truncate text-xs", variant.muted)}>
          {cardSection(card) === "club" ? `${formatCompact(metricValue(card, "Contributions"))} XI commits` : `@${card.login}`}
        </p>
      </div>
      <span className={cn("hidden truncate text-xs sm:block", variant.badge[card.finish])}>
        {finishLabel(card)}
      </span>
      <span className={cn("hidden rounded-full border px-2 py-0.5 text-center font-mono text-[10px] uppercase md:block", variant.beta)}>
        {cardSection(card)}
      </span>
      <div className="text-right">
        <p className="text-lg font-semibold leading-none">{card.overall}</p>
        <p className={cn("mt-1 font-mono text-[10px]", variant.muted)}>OVR</p>
      </div>
    </Link>
  );
}

export default function CommunityWall({
  cards,
  initialVariant = "light",
}: {
  cards: Card[];
  initialVariant?: CommunityVariant;
}) {
  const { resolvedTheme } = useFutClawTheme();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("all");
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all");
  const activeVariant: CommunityVariant = resolvedTheme === "light" ? "light" : initialVariant;
  const visual = VARIANTS[activeVariant];

  const visibleCards = useMemo(
    () =>
      sortCards(cards, sortMode, sectionFilter).filter((card) => {
        const section = cardSection(card);
        const matchesPosition = section === "club" || positionFilter === "all" || card.position === positionFilter;
        const matchesSection = sectionFilter === "all" || section === sectionFilter;
        return matchesSection && matchesPosition && searchCard(card, query);
      }),
    [cards, positionFilter, query, sectionFilter, sortMode],
  );

  const cardHref = (card: Card) => {
    const section = cardSection(card);
    if (section === "youtube") return `/community/${encodeURIComponent(card.login)}?platform=youtube`;
    if (section === "club") return clubHref(card);
    return `/community/${encodeURIComponent(card.login)}`;
  };

  return (
    <main className={cn("min-h-screen pt-16", visual.page)}>
      <div
        aria-hidden
        className={cn("pointer-events-none fixed inset-0 opacity-80", visual.subtleGrid)}
      />

      <section className="relative mx-auto max-w-[1120px] px-5 py-9 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn("font-mono text-[11px] font-semibold uppercase tracking-[0.18em]", visual.eyebrow)}>
                Community registry
              </p>
              <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]", visual.beta)}>
                Beta
              </span>
            </div>
            <h1 className="mt-3 text-[28px] font-semibold leading-9">Browse developer cards</h1>
            <p className={cn("mt-1 text-sm", visual.soft)}>
              Explore community-generated cards by latest drop, OVR, or position.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <label className="relative block w-full sm:w-[320px]">
              <Search className={cn("pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2", visual.muted)} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or handle..."
                className={cn(
                  "h-9 w-full rounded-[6px] border pl-9 pr-12 text-sm outline-none transition focus:border-[#006bff] focus:ring-3 focus:ring-[#006bff]/15",
                  visual.input,
                )}
              />
              <kbd className={cn("absolute right-2 top-1/2 -translate-y-1/2 rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px]", visual.controlMuted)}>
                ⌘K
              </kbd>
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className={cn("text-sm", visual.soft)}>
            {visibleCards.length.toLocaleString()} {visibleCards.length === 1 ? "card" : "cards"}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className={cn("flex h-9 w-fit overflow-hidden rounded-[6px] border", visual.controlMuted)}>
              {SECTION_FILTERS.map((filter, index) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSectionFilter(filter.id)}
                  className={cn(
                    "inline-flex items-center px-3 text-sm font-medium transition",
                    index > 0 && "border-l",
                    index > 0 && visual.divider,
                    sectionFilter === filter.id ? visual.selected : "hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className={cn("flex h-9 w-fit overflow-hidden rounded-[6px] border", visual.controlMuted)}>
              {[
                ["latest", "Latest"],
                ["top", sectionFilter === "club" ? "Top commits" : "Top OVR"],
              ].map(([mode, label], index) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortMode(mode as SortMode)}
                  className={cn(
                    "inline-flex items-center px-3 text-sm font-medium transition",
                    index > 0 && "border-l",
                    index > 0 && visual.divider,
                    sortMode === mode ? visual.selected : "hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={cn("flex h-9 max-w-full overflow-x-auto rounded-[6px] border", visual.controlMuted)}>
              {POSITION_FILTERS.map((position, index) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => setPositionFilter(position)}
                  className={cn(
                    "inline-flex min-w-10 items-center justify-center px-3 text-sm font-medium uppercase transition",
                    index > 0 && "border-l",
                    index > 0 && visual.divider,
                    positionFilter === position ? visual.selected : "hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  {position}
                </button>
              ))}
            </div>

            <div className={cn("flex h-9 overflow-hidden rounded-[6px] border", visual.controlMuted)}>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "inline-flex items-center gap-2 px-3 text-sm font-medium transition",
                  viewMode === "grid" ? visual.selected : "hover:bg-black/5 dark:hover:bg-white/5",
                )}
              >
                <Grid2X2 className="size-4" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "inline-flex items-center gap-2 border-l px-3 text-sm font-medium transition",
                  visual.divider,
                  viewMode === "list" ? visual.selected : "hover:bg-black/5 dark:hover:bg-white/5",
                )}
              >
                <List className="size-4" />
                List
              </button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCards.map((card, index) => (
              <CardTile key={`${card.platform ?? "github"}:${card.login}`} card={card} index={index} variant={visual} href={cardHref(card)} />
            ))}
          </div>
        ) : (
          <div className={cn("mt-5 overflow-hidden rounded-[8px] border", visual.panel)}>
            {visibleCards.map((card, index) => (
              <CardRow key={`${card.platform ?? "github"}:${card.login}`} card={card} index={index} variant={visual} href={cardHref(card)} />
            ))}
          </div>
        )}

        {visibleCards.length === 0 && (
          <div className={cn("mt-5 rounded-[8px] border p-8 text-center", visual.panel)}>
            <p className="text-sm font-medium">No cards found</p>
            <p className={cn("mt-1 text-sm", visual.muted)}>Try a different name or handle.</p>
          </div>
        )}
      </section>

    </main>
  );
}
