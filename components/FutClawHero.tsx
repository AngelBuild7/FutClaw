"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Activity,
  GitFork,
  IdCard,
  Share2,
  Sparkles,
} from "lucide-react";
import PlayerCard from "./card/PlayerCard";
import { SAMPLE_CARDS } from "@/lib/github/samples";
import YouTubeIcon from "./youtube-icon";
import type { Card } from "@/lib/scoring/types";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  );
}

const SIDE_STATS = [
  { label: "Commits", value: "2,456" },
  { label: "Stars", value: "12,891" },
  { label: "PRs", value: "342" },
  { label: "Issues", value: "128" },
  { label: "Repos", value: "51" },
];

const FEATURES = [
  { icon: Activity, title: "Real-time stats", subtitle: "Live from GitHub API" },
  { icon: IdCard, title: "FIFA-style cards", subtitle: "Beautiful & shareable" },
  { icon: Share2, title: "Share anywhere", subtitle: "X, LinkedIn, Discord..." },
];

const PLATFORMS = [
  { id: "github" as const, label: "GitHub", icon: GithubIcon, placeholder: "github username" },
  { id: "youtube" as const, label: "YouTube", icon: YouTubeIcon, placeholder: "youtube channel name" },
  { id: "repo" as const, label: "Repo Club", icon: GitFork, placeholder: "owner/repo" },
];

type ScoutMode = (typeof PLATFORMS)[number]["id"];

function heroShowcaseCard(card: Card): Card {
  return {
    ...card,
    customization: {
      ...card.customization,
      theme: card.finish === "icon" ? "icon" : card.finish === "gold" ? "gold" : card.customization?.theme,
    },
  };
}

interface Props {
  onScout: (name: string, platform: ScoutMode) => void;
  scoutCount: number | null;
}

export default function FutClawHero({ onScout, scoutCount }: Props) {
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<ScoutMode>("github");

  // Real FUT cards from the project. The hero star gets the FutClaw lobster as
  // its "player" photo; two more real samples fan out behind it.
  const { hero, behindLeft, behindRight } = useMemo(() => {
    const torvalds =
      SAMPLE_CARDS.find((c) => c.login === "torvalds") ?? SAMPLE_CARDS[0];
    const hero: Card = heroShowcaseCard({ ...torvalds, name: "clawjei", avatarUrl: "/mascot.png" });
    const rest = SAMPLE_CARDS.filter((c) => c.login !== hero.login);
    return {
      hero,
      behindLeft: rest[0] ? heroShowcaseCard(rest[0]) : undefined,
      behindRight: rest[1] ? heroShowcaseCard(rest[1]) : undefined,
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) onScout(username, platform);
  };

  const currentPlatform = PLATFORMS.find((p) => p.id === platform)!;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg text-ink">
      {/* ambient red glows */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[1000px] w-[1000px] -translate-y-1/4 translate-x-1/3 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(229,62,62,0.22) 0%, rgba(229,62,62,0.05) 45%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-40 top-1/3 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(229,62,62,0.15) 0%, transparent 65%)",
        }}
      />

      {/* ── Hero grid ── */}
      <div className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-5 pb-14 pt-28 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-8 lg:px-10 lg:pt-24">
        {/* Left column */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] py-1 pl-2.5 pr-1 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-brand" aria-hidden />
            <span className="text-[13px] font-medium tracking-tight text-ink-dim">
              FutClaw
            </span>
            <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-brand">
              Beta
            </span>
          </div>

          <h1 className="font-display text-[2.75rem] font-black leading-[0.95] tracking-[-0.02em] text-balance sm:text-6xl md:text-7xl lg:text-[5.25rem]">
            Your GitHub,
            <br />
            rated out of
            <br />
            <span
              className="text-brand"
              style={{
                textShadow:
                  "0 0 40px rgba(229,62,62,0.6), 0 0 80px rgba(229,62,62,0.35)",
              }}
            >
              99
            </span>
          </h1>

          <p className="mt-7 max-w-md text-pretty text-base leading-relaxed text-ink-dim sm:text-lg">
            Turn any GitHub profile into a FIFA-style player card. Scored from
            real commits, stars, and contributions.{" "}
            <span className="font-semibold text-brand">Share it anywhere.</span>
          </p>

          <div className="mt-8 w-full max-w-[min(100%,30rem)]">
            {/* Platform selector */}
            <div className="mb-3 flex items-center gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    platform === p.id
                      ? "bg-white/[0.08] text-ink"
                      : "text-ink-mute hover:text-ink-dim hover:bg-white/[0.04]"
                  }`}
                >
                  <p.icon className="size-4" />
                  {p.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-2 rounded-xl border border-line bg-white/[0.03] p-1.5 backdrop-blur-sm focus-within:border-brand/40 min-[420px]:rounded-2xl min-[420px]:p-2 sm:flex-row sm:items-center"
            >
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={currentPlatform.placeholder}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-label={currentPlatform.placeholder}
                className="h-11 w-full min-w-0 flex-none rounded-lg bg-white/[0.04] px-3 text-base text-ink outline-none placeholder:text-ink-mute min-[420px]:h-12 min-[420px]:rounded-xl min-[420px]:px-4 sm:h-11 sm:flex-1 sm:rounded-none sm:bg-transparent sm:text-sm"
              />
              <button
                type="submit"
                className="flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(229,62,62,0.7)] transition hover:bg-brand-mid min-[420px]:h-12 min-[420px]:rounded-xl min-[420px]:px-5 sm:h-11 sm:w-auto"
              >
                {platform === "repo" ? "Build club" : "Get your card"}
                <ArrowRight className="size-4" />
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between rounded-[10px] border border-line bg-white/[0.025] px-4 py-3 backdrop-blur-sm">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  Public scouts
                </p>
                <p className="mt-1 text-sm text-ink-dim">
                  Cards generated by the FutClaw loop.
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-semibold leading-none text-ink tabular-nums">
                  {scoutCount == null ? "—" : scoutCount.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-medium text-ink-soft">cards rated</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4 lg:justify-start">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-full border border-brand/25 bg-brand/10">
                  <feature.icon className="size-4 text-brand" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-tight">
                    {feature.title}
                  </p>
                  <p className="text-xs leading-tight text-ink-soft">
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="relative flex items-center justify-center lg:justify-end">
          {/* glow rings */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 600 600"
              className="h-[520px] w-[520px] opacity-60"
              fill="none"
              aria-hidden
            >
              <circle cx="300" cy="300" r="120" stroke="rgba(229,62,62,0.25)" strokeWidth="1" />
              <circle cx="300" cy="300" r="190" stroke="rgba(229,62,62,0.18)" strokeWidth="1" />
              <circle cx="300" cy="300" r="260" stroke="rgba(229,62,62,0.1)" strokeWidth="1" />
              <path d="M60 300 A240 240 0 0 1 300 60" stroke="rgba(229,62,62,0.4)" strokeWidth="2" strokeLinecap="round" />
              <path d="M540 300 A240 240 0 0 1 300 540" stroke="rgba(229,62,62,0.3)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="relative flex items-center justify-center gap-4 sm:gap-6">
            {/* Card cluster */}
            <div className="relative w-[240px] sm:w-[280px]">
              {/* fanned real cards behind */}
              {behindLeft && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -left-14 top-6 hidden w-[220px] -rotate-[10deg] opacity-45 blur-[1px] sm:block"
                >
                  <PlayerCard card={behindLeft} />
                </div>
              )}
              {behindRight && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 top-3 hidden w-[220px] rotate-[8deg] opacity-40 blur-[1px] sm:block"
                >
                  <PlayerCard card={behindRight} />
                </div>
              )}

              {/* featured lobster card */}
              <div className="relative -rotate-[4deg]">
                <PlayerCard card={hero} />
              </div>
            </div>

            {/* Stats panel */}
            <div className="hidden w-[180px] translate-y-2 self-center rounded-2xl border border-brand/25 bg-panel/80 p-4 shadow-[0_0_40px_-14px_rgba(229,62,62,0.5)] backdrop-blur-md lg:block">
              <p className="text-sm font-semibold">Your stats</p>

              <svg viewBox="0 0 160 40" className="mt-2 h-7 w-full" fill="none" aria-hidden>
                <path
                  d="M0 30 L20 25 L40 28 L60 15 L80 20 L100 8 L120 12 L140 4 L160 6"
                  stroke="var(--color-brand)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="mt-3 space-y-2.5 border-t border-line pt-3">
                {SIDE_STATS.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="text-ink-soft">{s.label}</span>
                    <span className="font-mono font-semibold tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-line pt-3 text-center">
                <p
                  className="font-display text-3xl font-black text-brand"
                  style={{ textShadow: "0 0 24px rgba(229,62,62,0.5)" }}
                >
                  99
                </p>
                <p className="text-[10px] text-ink-soft">Overall Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
