"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Code2,
  ExternalLink,
  GitBranch,
  Globe,
  Link2,
  MoreHorizontal,
  Share2,
  ShieldCheck,
  Star,
} from "lucide-react";
import PlayerCard from "@/components/card/PlayerCard";
import { cn } from "@/lib/utils";
import { useFutClawTheme } from "@/lib/useFutClawTheme";
import type { Card, Finish, StatKey } from "@/lib/scoring/types";

type CommunityVariant = "light" | "dark";

const STAT_ORDER: StatKey[] = ["pac", "sho", "pas", "dri", "def", "phy"];

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
    page: "bg-[#ffffff] text-[#171717]",
    grid: "community-grid-light",
    nav: "border-[#00000015] bg-white/85",
    panel: "border-[#00000015] bg-white",
    panelSoft: "border-[#00000015] bg-[#fafafa]",
    muted: "text-[#7d7d7d]",
    soft: "text-[#4d4d4d]",
    divider: "border-[#00000015]",
    control: "border-[#00000015] bg-white text-[#171717] hover:bg-[#fafafa]",
    stat: "border-[#00000015] bg-white",
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
    grid: "community-grid-dark",
    nav: "border-[#ffffff17] bg-black/85",
    panel: "border-[#ffffff17] bg-[#0a0a0a]",
    panelSoft: "border-[#ffffff17] bg-black",
    muted: "text-[#878787]",
    soft: "text-[#a0a0a0]",
    divider: "border-[#ffffff17]",
    control: "border-[#ffffff17] bg-[#0a0a0a] text-[#ededed] hover:bg-[#1a1a1a]",
    stat: "border-[#ffffff17] bg-[#0a0a0a]",
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

function statLabel(stat: StatKey) {
  return stat.toUpperCase();
}

function normalizeExternalUrl(url?: string | null) {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function displayExternalUrl(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function ThemeLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function CommunityCardDetail({
  card,
  communityRank,
}: {
  card: Card;
  communityRank?: number | null;
}) {
  const { resolvedTheme } = useFutClawTheme();
  const activeVariant: CommunityVariant = resolvedTheme === "light" ? "light" : "dark";
  const visual = VARIANTS[activeVariant];
  const language = card.topLanguage || card.languageLogo?.name || "Unknown";
  const metrics = card.report?.metrics?.slice(0, 3) ?? [];
  const platformUrl = card.platform === "youtube" ? `https://youtube.com/@${card.login}` : card.profile?.githubUrl || `https://github.com/${card.login}`;
  const platformLabel = card.platform === "youtube" ? "YouTube" : "GitHub";
  const scoutHref = card.platform === "youtube" ? `/youtube/${card.login}` : `/u/${card.login}`;
  const websiteUrl = normalizeExternalUrl(card.profile?.websiteUrl);
  const twitterUsername = card.profile?.twitterUsername?.replace(/^@/, "");
  const repositories = card.profile?.repositories?.filter((repo) => repo.name && repo.url).slice(0, 4) ?? [];

  return (
    <main className={cn("min-h-screen pt-16", visual.page)}>
      <div
        aria-hidden
        className={cn("pointer-events-none fixed inset-0 opacity-80", visual.grid)}
      />

      <section className={cn("relative border-b", visual.divider)}>
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-5 sm:px-6 lg:px-8">
          <ThemeLink
            href="/community"
            className={cn("inline-flex items-center gap-2 text-sm font-medium", visual.soft)}
          >
            <ArrowLeft className="size-4" />
            Back to browse
          </ThemeLink>

          <div className="flex items-center gap-2">
            <ThemeLink
              href={scoutHref}
              className={cn("inline-flex h-9 items-center gap-2 rounded-[6px] border px-3 text-sm font-medium", visual.control)}
            >
              <ExternalLink className="size-4" />
              Full scout
            </ThemeLink>
            <button
              type="button"
              className={cn("hidden h-9 items-center gap-2 rounded-[6px] border px-3 text-sm font-medium sm:inline-flex", visual.control)}
            >
              <Share2 className="size-4" />
              Share
            </button>
            <button
              type="button"
              aria-label="More actions"
              className={cn("inline-flex size-9 items-center justify-center rounded-[6px] border", visual.control)}
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-[1120px] px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <div className="flex justify-center lg:justify-start">
            <div className="w-[230px] sm:w-[250px]">
              <PlayerCard card={card} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-[34px] font-semibold leading-10">{card.name}</h1>
                <p className={cn("mt-1 text-base", visual.muted)}>@{card.login}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className={cn("inline-flex h-8 items-center rounded-[6px] border px-3 font-mono text-xs font-semibold", visual.panel, visual.badge[card.finish])}>
                    {card.finish.toUpperCase()}
                  </span>
                  <span className={cn("inline-flex h-8 items-center rounded-[6px] border px-3 text-xs font-medium", visual.panel)}>
                    {card.position}
                  </span>
                  <span className={cn("inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-3 text-xs font-medium", visual.panel)}>
                    <Code2 className="size-3.5" />
                    {language}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-[48px] font-semibold leading-none">{card.overall}</p>
                <p className={cn("mt-1 font-mono text-xs uppercase", visual.muted)}>OVR</p>
              </div>
            </div>

            <div className={cn("mt-7 grid grid-cols-3 overflow-hidden rounded-[8px] border sm:grid-cols-6", visual.divider)}>
              {STAT_ORDER.map((stat) => (
                <div key={stat} className={cn("border-r px-4 py-4 text-center last:border-r-0", visual.divider, visual.stat)}>
                  <p className="text-2xl font-semibold leading-none">{card.stats[stat]}</p>
                  <p className={cn("mt-1 font-mono text-xs", visual.muted)}>{statLabel(stat)}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div>
                <p className={cn("text-xs", visual.muted)}>Tier</p>
                <p className={cn("mt-2 inline-flex items-center gap-2 text-sm font-semibold", visual.badge[card.finish])}>
                  <ShieldCheck className="size-4" />
                  {finishLabel(card)}
                </p>
              </div>
              <div>
                <p className={cn("text-xs", visual.muted)}>Stacks</p>
                <p className="mt-2 text-sm font-semibold">{card.report?.metrics?.length || 1}</p>
              </div>
              <div>
                <p className={cn("text-xs", visual.muted)}>Archetype</p>
                <p className="mt-2 truncate text-sm font-semibold">{card.archetype}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-[1120px] gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold">About</h2>
            <p className={cn("mt-4 max-w-xl text-sm leading-6", visual.soft)}>
              {card.profile?.bio || card.archetypeBlurb || "Community scout profile generated from public development signals."}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Top signals</h2>
            <div className="mt-4 space-y-3">
              {(metrics.length ? metrics : card.report.metrics.slice(0, 3)).map((metric) => (
                <div key={metric.label} className="grid grid-cols-[110px_minmax(0,1fr)_44px] items-center gap-4">
                  <p className="truncate text-sm">{metric.label}</p>
                  <div className={cn("h-1.5 overflow-hidden rounded-full", activeVariant === "dark" ? "bg-[#1f1f1f]" : "bg-[#f2f2f2]")}>
                    <div className="h-full rounded-full bg-current" style={{ width: `${Math.max(6, metric.score)}%` }} />
                  </div>
                  <p className={cn("text-right text-xs", visual.muted)}>{metric.score}%</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Links</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <a
                href={platformUrl}
                target="_blank"
                rel="noreferrer"
                className={cn("inline-flex items-center gap-3", visual.soft)}
              >
                <GitBranch className="size-4" />
                {platformLabel}
                <span className={cn("ml-4 truncate", visual.muted)}>{displayExternalUrl(platformUrl)}</span>
              </a>
              <ThemeLink href={scoutHref} className={cn("inline-flex items-center gap-3", visual.soft)}>
                <Link2 className="size-4" />
                Scout report
                <span className={cn("ml-4 truncate", visual.muted)}>{scoutHref}</span>
              </ThemeLink>
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("inline-flex items-center gap-3", visual.soft)}
                >
                  <Globe className="size-4" />
                  Website
                  <span className={cn("ml-4 truncate", visual.muted)}>{displayExternalUrl(websiteUrl)}</span>
                </a>
              ) : null}
              {twitterUsername ? (
                <a
                  href={`https://x.com/${twitterUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("inline-flex items-center gap-3", visual.soft)}
                >
                  <AtSign className="size-4" />
                  X
                  <span className={cn("ml-4 truncate", visual.muted)}>x.com/{twitterUsername}</span>
                </a>
              ) : null}
            </div>
          </div>

          {repositories.length > 0 ? (
            <div className={cn("overflow-hidden rounded-[8px] border", visual.panel)}>
              <div className={cn("border-b px-4 py-3", visual.divider)}>
                <h2 className="text-sm font-semibold">Repositories</h2>
              </div>
              {repositories.map((repo) => (
                <a
                  key={repo.url}
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("grid grid-cols-[minmax(0,1fr)_90px_64px] gap-3 border-b px-4 py-4 text-sm last:border-b-0", visual.divider)}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{repo.name}</p>
                    <p className={cn("mt-1 truncate text-xs", visual.muted)}>
                      {repo.description || "Public GitHub repository"}
                    </p>
                  </div>
                  <span className={cn("truncate text-xs", visual.muted)}>{repo.language || language}</span>
                  <span className={cn("inline-flex items-center justify-end gap-1 text-xs", visual.muted)}>
                    <Star className="size-3.5" />
                    {repo.stars}
                  </span>
                </a>
              ))}
              <ThemeLink
                href={scoutHref}
                className={cn("inline-flex items-center gap-2 px-4 py-4 text-sm font-medium", visual.soft)}
              >
                View full scout
                <ArrowRight className="size-4" />
              </ThemeLink>
            </div>
          ) : null}
        </div>

        <aside className="space-y-3">
          <div className={cn("rounded-[8px] border p-4", visual.panel)}>
            <p className={cn("font-mono text-xs", visual.muted)}>Scout snapshot</p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-semibold">{card.overall}</p>
                <p className={cn("font-mono text-[10px]", visual.muted)}>Avg OVR</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">1</p>
                <p className={cn("font-mono text-[10px]", visual.muted)}>Stacks</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{card.overall >= 90 ? 1 : 0}</p>
                <p className={cn("font-mono text-[10px]", visual.muted)}>Elite</p>
              </div>
            </div>
          </div>

          <div className={cn("rounded-[8px] border p-4", visual.panel)}>
            <p className={cn("font-mono text-xs", visual.muted)}>Latest drop</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{card.name}</p>
                <p className={cn("truncate text-xs", visual.muted)}>@{card.login}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold leading-none">{card.overall}</p>
                <p className={cn("mt-1 font-mono text-[10px]", visual.muted)}>{card.position}</p>
              </div>
            </div>
          </div>

          <div className={cn("rounded-[8px] border p-4", visual.panel)}>
            <p className={cn("font-mono text-xs", visual.muted)}>Top OVR rank</p>
            <p className="mt-5 text-3xl font-semibold">
              {communityRank ? `#${communityRank}` : "Unranked"}
            </p>
            <p className={cn("mt-1 text-sm", visual.muted)}>of community cards</p>
          </div>
        </aside>
      </section>

    </main>
  );
}
