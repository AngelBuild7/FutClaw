"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Crown,
  FastForward,
  Flame,
  FolderGit2,
  GitPullRequest,
  Infinity as InfinityIcon,
  Languages,
  type LucideIcon,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import type { Card, Finish, Metric, Playstyle } from "@/lib/scoring/types";
import { languageLogoUrl } from "@/lib/github/languages";
import { categoryLogoUrl } from "@/lib/youtube/categories";
import { formatCount } from "@/lib/format";
import { deEmDash } from "@/lib/text";
import { resolveResultTheme, rgba } from "./finishTheme";

const PLAYSTYLE_ICONS: Record<string, LucideIcon> = {
  star: Star,
  flame: Flame,
  zap: Zap,
  "fast-forward": FastForward,
  infinity: InfinityIcon,
  shield: Shield,
  "git-pull-request": GitPullRequest,
  users: Users,
  languages: Languages,
  "folder-git": FolderGit2,
  clock: Clock,
};

// Hide a logo/image that fails to load (e.g. a CDN miss) rather than show a broken icon.
const hideOnError: React.ReactEventHandler<HTMLImageElement> = (e) => {
  e.currentTarget.style.display = "none";
};

// The scout's one-line verdict — the signature, in recruitment vernacular.
const VERDICTS: Record<Finish, string> = {
  icon: "Generational talent",
  toty: "Elite prospect",
  totw: "In-form, in demand",
  gold: "First-team ready",
  silver: "Squad rotation",
  bronze: "One to watch",
  founder: "The architect",
};

// Lightweight hover popup explaining why a value was given.
function Tip({
  text,
  align = "center",
  children,
}: {
  text: string;
  align?: "left" | "right" | "center";
  children: React.ReactNode;
}) {
  const pos = align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <span className="group/tip relative inline-flex cursor-help items-center">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full ${pos} z-30 mb-2 hidden w-max max-w-[220px] whitespace-normal rounded-lg border border-line-strong bg-[#151515] px-3 py-2 text-left text-[12px] font-normal leading-snug text-ink shadow-[0_10px_30px_rgba(0,0,0,.65)] group-hover/tip:block`}
      >
        {text}
      </span>
    </span>
  );
}

function StarRating({ value, accent }: { value: number; accent: string }) {
  return (
    <span className="inline-flex gap-[3px]" style={{ color: accent }} aria-label={`${value} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} className={i < value ? "fill-current drop-shadow-[0_0_8px_currentColor]" : "fill-transparent text-white/30"} />
      ))}
    </span>
  );
}

function AttributeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.11] py-3 last:border-0">
      <span className="text-[13px] font-medium text-white/72">{label}</span>
      <span className="text-[13px] font-semibold tracking-[-.01em] text-white">{children}</span>
    </div>
  );
}

// Vercel-like dossier panel: restrained surface, hairline border, accent only as
// a small system status light. The content carries the football/scout flavor.
function Section({
  title,
  accent,
  className,
  children,
}: {
  title: string;
  accent: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-[18px] border border-white/[0.13] bg-[#080808]/88 p-4 shadow-[0_18px_54px_-38px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.075)] backdrop-blur-xl ${className ?? ""}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent, boxShadow: `0 0 14px ${accent}80` }} />
          <h3 className="truncate font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-white/82">{title}</h3>
        </div>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-white/18 to-transparent" />
      </div>
      {children}
    </section>
  );
}

function PlaystyleList({ playstyles, accent }: { playstyles: Playstyle[]; accent: string }) {
  if (playstyles.length === 0) {
    return <p className="py-1 text-[13.5px] leading-snug text-white/64">No standout traits yet — keep shipping.</p>;
  }
  return (
    <ul className="flex flex-col gap-1 pt-1">
      {playstyles.map((p) => {
        const Icon = PLAYSTYLE_ICONS[p.icon] ?? Star;
        return (
          <li key={p.name}>
            <Tip text={p.reason} align="left">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.03]">
                <Icon size={15} style={{ color: accent }} aria-hidden />
              </span>
              <span className="ml-3 text-[13px] font-semibold text-white/78">{p.name}</span>
              {p.plus && (
                <span
                  className="ml-2 rounded-[5px] px-[5px] text-[10px] font-bold leading-[15px]"
                  style={{ background: accent, color: "#0b0a0f" }}
                  title="PlayStyle+"
                >
                  +
                </span>
              )}
            </Tip>
          </li>
        );
      })}
    </ul>
  );
}

function MetricBar({ metric, accent, index = 0 }: { metric: Metric; accent: string; index?: number }) {
  const fill = Math.max(metric.score, 4); // never an empty bar; show a sliver minimum
  // Entrance: each row eases up + its bar sweeps from 0 to value, staggered down
  // the list, so the panel "draws itself" like a live scouting readout.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Set is kept inside the timeout (never synchronous in the effect body) so it
    // can't cascade renders. Reduced motion uses a 0ms delay — the global
    // prefers-reduced-motion reset in globals.css makes the transition instant.
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const t = setTimeout(() => setMounted(true), reduced ? 0 : 120 + index * 55);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(6px)",
        transition: "opacity .5s ease, transform .5s cubic-bezier(.16,1,.3,1)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-white/72">{metric.label}</span>
        <span className="flex items-baseline gap-[6px]">
          <span className="text-[11px] tabular-nums text-white/64">
            {formatCount(metric.value)}
            {metric.unit ? ` ${metric.unit}` : ""}
          </span>
          <span className="text-[15px] font-semibold leading-none tabular-nums text-white">
            {metric.score}
          </span>
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.14]">
        <div
          className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
          style={{ width: mounted ? `${fill}%` : "0%", background: `linear-gradient(90deg, ${accent}99, ${accent})` }}
        />
      </div>
    </div>
  );
}

// A child that fades + lifts into place on mount, staggered by `step`. Honors
// reduced motion (appears instantly). Powers the header's cascade entrance.
function Stagger({ step, children, className }: { step: number; children: React.ReactNode; className?: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const t = setTimeout(() => setShown(true), reduced ? 0 : 90 + step * 110);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0) scale(1)" : "translateY(10px) scale(.98)",
        transition: "opacity .55s ease, transform .55s cubic-bezier(.16,1,.3,1)",
      }}
    >
      {children}
    </div>
  );
}

// Scouting-dossier header. A left "grade stamp" (the OVR + tier, the scout's
// verdict-at-a-glance) anchors the row; the identity block sits beside it with
// the name as hero, one clean meta line, and the verdict inline. No centered
// stack, no floating pill, no decorative flanking rules.
export function ReportHeader({ card }: { card: Card }) {
  const theme = resolveResultTheme(card);
  const accent = theme.ink;
  const externalUrl = card.platform === "youtube" ? `https://youtube.com/@${card.login}` : card.profile?.githubUrl || `https://github.com/${card.login}`;
  const topIdentity = card.platform === "youtube" ? card.topCategory : card.topLanguage;
  const topLogo =
    card.platform === "youtube"
      ? card.categoryLogo
        ? { src: categoryLogoUrl(card.categoryLogo.slug), alt: card.categoryLogo.name }
        : null
      : card.languageLogo
        ? { src: languageLogoUrl(card.languageLogo.slug), alt: card.languageLogo.name }
        : null;
  return (
    <header className="relative flex w-full items-center gap-[clamp(14px,3vw,24px)]">
      {/* left — the grade stamp: OVR over tier, the dossier's headline metric */}
      <Stagger step={0} className="shrink-0">
        <div
          className="relative flex h-[clamp(76px,12vw,96px)] w-[clamp(76px,12vw,96px)] flex-col items-center justify-center rounded-[18px] border"
          style={{
            borderColor: `${accent}40`,
            background: `linear-gradient(160deg, ${accent}14, transparent 68%), #0a0a0a`,
            boxShadow: `0 0 0 1px rgba(255,255,255,.025), inset 0 1px 0 ${accent}20`,
          }}
        >
          <span
            className="text-[clamp(34px,6vw,46px)] font-semibold leading-[.82] tracking-[-.08em] tabular-nums"
            style={{ color: accent }}
          >
            {card.overall}
          </span>
          <span className="mt-1 font-mono text-[10px] font-semibold tracking-[.18em] text-white/72">
            {card.finishLabel}
          </span>
        </div>
      </Stagger>

      {/* right — identity block, left-aligned */}
      <div className="min-w-0 flex-1 text-left">
        <Stagger step={1}>
          <div className="flex items-center gap-[8px]">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[.24em]" style={{ color: accent }}>
              Scout report
            </span>
            <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
          </div>
        </Stagger>

        <Stagger step={2} className="relative">
          <h2
            className="mt-1 truncate text-[clamp(34px,5.4vw,56px)] font-semibold leading-[.95] tracking-[-.065em] text-white drop-shadow-[0_8px_34px_rgba(0,0,0,.55)]"
          >
            {card.name}
          </h2>
        </Stagger>

        <Stagger step={3}>
          <div className="mt-[8px] flex flex-wrap items-center gap-x-[10px] gap-y-[6px]">
            <span
              className="inline-flex items-center rounded-md border px-2 py-1 font-mono text-[11px] font-semibold leading-none tracking-[.12em]"
              style={{ color: accent, borderColor: `${accent}50`, background: `${accent}14` }}
            >
              {card.position}
            </span>
            {card.founder && (
              <Tip text={card.founder.tagline}>
                <span
                  className="font-display inline-flex items-center gap-[5px] rounded-[6px] border px-[9px] py-[3px] text-[12.5px] font-bold leading-none tracking-[.14em]"
                  style={{
                    color: card.founder.accent,
                    borderColor: rgba(card.founder.accent, 0.45),
                    background: rgba(card.founder.accent, 0.14),
                  }}
                >
                  <Crown size={13} aria-hidden style={{ fill: card.founder.accent }} />
                  {card.founder.label}
                </span>
              </Tip>
            )}
            <span className="text-[14px] font-semibold text-white/82">{card.archetype}</span>
            <span aria-hidden className="h-[11px] w-px bg-white/18" />
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[13px] font-medium text-white/64 underline-offset-2 transition hover:text-white hover:underline"
            >
              @{card.login}
            </a>
            {topIdentity && (
              <>
                <span aria-hidden className="h-[11px] w-px bg-white/18" />
                <span className="inline-flex items-center gap-[6px] text-[13px] font-medium text-white/72">
                  {topLogo && (
                    <img
                      src={topLogo.src}
                      onError={hideOnError}
                      alt={topLogo.alt}
                      className="h-[15px] w-[15px] object-contain"
                    />
                  )}
                  {topIdentity}
                </span>
              </>
            )}
          </div>
        </Stagger>

        {/* verdict inline: label + grade, then the blurb continues the sentence */}
        <Stagger step={4}>
          <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-[1.5] text-white/66">
            <span className="mr-2 font-mono text-[10.5px] font-semibold uppercase tracking-[.14em]" style={{ color: accent }}>
              {VERDICTS[card.finish].toUpperCase()}
            </span>
            {deEmDash(card.archetypeBlurb)}.
          </p>
        </Stagger>
      </div>
    </header>
  );
}

// Left side: attributes + playstyles.
export function AttributesPanel({ card }: { card: Card }) {
  const accent = resolveResultTheme(card).ink;
  const { report } = card;
  return (
    <div className="flex w-full flex-col gap-[14px]">
      <Section title="ATTRIBUTES" accent={accent}>
        <AttributeRow label="Skill moves">
          <Tip text={report.reasons.skillMoves} align="right">
            <StarRating value={report.skillMoves} accent={accent} />
          </Tip>
        </AttributeRow>
        <AttributeRow label="Weak foot">
          <Tip text={report.reasons.weakFoot} align="right">
            <StarRating value={report.weakFoot} accent={accent} />
          </Tip>
        </AttributeRow>
        <AttributeRow label="Work rate">
          <Tip text={report.reasons.workRate} align="right">
            <span>
              {report.workRate.attack} / {report.workRate.defense}
            </span>
          </Tip>
        </AttributeRow>
        <AttributeRow label="Style">
          <Tip text={report.reasons.style} align="right">
            <span>{report.style}</span>
          </Tip>
        </AttributeRow>
      </Section>

      <Section title="PLAYSTYLES" accent={accent}>
        <PlaystyleList playstyles={report.playstyles} accent={accent} />
      </Section>
    </div>
  );
}

// Right side: scouting metrics.
export function MetricsPanel({ card }: { card: Card }) {
  const accent = resolveResultTheme(card).ink;
  return (
    <Section title="SCOUTING METRICS" accent={accent} className="w-full">
      <div className="flex flex-col gap-[13px] pt-1">
        {card.report.metrics.map((m, i) => (
          <MetricBar key={m.label} metric={m} accent={accent} index={i} />
        ))}
      </div>
    </Section>
  );
}
