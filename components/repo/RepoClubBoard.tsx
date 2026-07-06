"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { Check, Copy, Download, ImageDown, Link2, Share2 } from "lucide-react";
import PlayerCard from "@/components/card/PlayerCard";
import { renderCardImage } from "@/lib/capture";
import type { Card } from "@/lib/scoring/types";

type SquadMember = {
  card: Card;
  contributions: number;
};

type RepoClubSummary = {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
};

type Props = {
  summary: RepoClubSummary;
  squad: SquadMember[];
};

type ClubStyle = "gold" | "crimson" | "ice";

const BOARD_RENDER_OPTS = { pixelRatio: 2, cacheBust: true } as const;
const STORY_RENDER_OPTS = { pixelRatio: 1, cacheBust: true } as const;
const SITE = "https://futclaw.com";

const CLUB_STYLES: Record<ClubStyle, { label: string; accent: string; accentSoft: string; border: string; glow: string }> = {
  gold: {
    label: "Gold",
    accent: "#d4af37",
    accentSoft: "rgba(212,175,55,.34)",
    border: "rgba(212,175,55,.38)",
    glow: "rgba(212,175,55,.16)",
  },
  crimson: {
    label: "Crimson",
    accent: "#ff565f",
    accentSoft: "rgba(255,86,95,.32)",
    border: "rgba(255,86,95,.38)",
    glow: "rgba(226,22,42,.16)",
  },
  ice: {
    label: "Ice",
    accent: "#47a8ff",
    accentSoft: "rgba(71,168,255,.32)",
    border: "rgba(71,168,255,.38)",
    glow: "rgba(71,168,255,.14)",
  },
};

const SLOTS = [
  { role: "LW", x: 26.2, y: 24.2 },
  { role: "ST", x: 50, y: 24.2 },
  { role: "RW", x: 73.8, y: 24.2 },
  { role: "CM", x: 28.6, y: 43.1 },
  { role: "CM", x: 50, y: 43.1 },
  { role: "CM", x: 71.3, y: 43.1 },
  { role: "LB", x: 16, y: 64.9 },
  { role: "CB", x: 38.2, y: 64.9 },
  { role: "CB", x: 61.7, y: 64.9 },
  { role: "RB", x: 83.9, y: 64.9 },
  { role: "GK", x: 50, y: 82.4 },
] as const;

const STORY_SLOTS = [
  { role: "LW", x: 23.5, y: 31.6 },
  { role: "ST", x: 50, y: 31.6 },
  { role: "RW", x: 76.3, y: 31.6 },
  { role: "CM", x: 27.2, y: 47 },
  { role: "CM", x: 50, y: 47 },
  { role: "CM", x: 72.7, y: 47 },
  { role: "LB", x: 14.2, y: 63.1 },
  { role: "CB", x: 37.8, y: 63.1 },
  { role: "CB", x: 62.1, y: 63.1 },
  { role: "RB", x: 85.5, y: 63.1 },
  { role: "GK", x: 50, y: 75.3 },
] as const;

function XLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 10_000 ? "compact" : "standard" }).format(value);
}

function repoClubUrl(summary: RepoClubSummary) {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE;
  return `${origin}/${encodeURIComponent(summary.owner)}/${encodeURIComponent(summary.repo)}`;
}

function shareText(summary: RepoClubSummary) {
  return `built a FutClaw Starting XI for ${summary.fullName}. top contributors, scouted like a club.`;
}

function intentUrl(platform: "x" | "linkedin", summary: RepoClubSummary) {
  const url = repoClubUrl(summary);
  if (platform === "linkedin") {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  }
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText(summary)}\n\nbuild yours →`)}&url=${encodeURIComponent(url)}&hashtags=FutClaw`;
}

const actionButton =
  "group inline-flex items-center justify-center gap-[7px] rounded-lg border border-line bg-[#0a0a0a]/80 py-[10px] text-[12.5px] font-medium text-ink-dim transition-all duration-150 ease-out hover:-translate-y-px hover:border-white/25 hover:bg-[#1a1a1a] hover:text-ink active:translate-y-0 active:scale-[.99] disabled:opacity-60";

export default function RepoClubBoard({ summary, squad }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const [clubStyle, setClubStyle] = useState<ClubStyle>("gold");
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(true);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supported = typeof navigator !== "undefined" && typeof navigator.share === "function";
    if (supported) return;
    const t = setTimeout(() => setCanNativeShare(false), 0);
    return () => clearTimeout(t);
  }, []);

  const finish = (id: string) => {
    setDone(id);
    setTimeout(() => setDone((current) => (current === id ? null : current)), 1500);
  };

  const nativeShare = async () => {
    const node = boardRef.current;
    const payload = { title: "FutClaw RepoClub", text: shareText(summary), url: repoClubUrl(summary) };
    try {
      if (node && typeof navigator.canShare === "function") {
        const blob = await renderCardImage(node, (target) => toBlob(target, BOARD_RENDER_OPTS));
        if (blob) {
          const file = new File([blob], `${summary.owner}-${summary.repo}-repoclub.png`, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ ...payload, files: [file] });
            return;
          }
        }
      }
      await navigator.share(payload);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      window.open(intentUrl("x", summary), "_blank", "noopener,noreferrer");
    }
  };

  const downloadBoard = async () => {
    const node = boardRef.current;
    if (!node || busy) return;
    setBusy("download");
    setError(null);
    try {
      const url = await renderCardImage(node, (target) => toPng(target, BOARD_RENDER_OPTS));
      const a = document.createElement("a");
      a.download = `${summary.owner}-${summary.repo}-repoclub.png`;
      a.href = url;
      a.click();
      finish("download");
    } catch (e) {
      setError(`Download failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const copyImage = async () => {
    const node = boardRef.current;
    if (!node || busy) return;
    setBusy("copy-image");
    setError(null);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": renderCardImage(node, async (target) => {
            const blob = await toBlob(target, BOARD_RENDER_OPTS);
            if (!blob) throw new Error("render returned no image");
            return blob;
          }),
        }),
      ]);
      finish("copy-image");
    } catch (e) {
      setError(`Copy image failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(repoClubUrl(summary));
      setLinkCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const storyFormat = async () => {
    const node = storyRef.current;
    if (!node || busy) return;
    setBusy("story");
    setError(null);
    try {
      const blob = await renderCardImage(node, async (target) => {
        const rendered = await toBlob(target, STORY_RENDER_OPTS);
        if (!rendered) throw new Error("render returned no image");
        return rendered;
      });
      const file = new File([blob], `${summary.owner}-${summary.repo}-repoclub-story.png`, { type: "image/png" });
      const isMobile = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
      let shared = false;
      if (isMobile && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title: "FutClaw RepoClub", text: shareText(summary), url: repoClubUrl(summary), files: [file] });
          shared = true;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") shared = true;
        }
      }
      if (!shared) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = file.name;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
      }
      finish("story");
    } catch (e) {
      setError(`Story failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
      <div className="overflow-x-auto pb-2">
        <BoardCanvas ref={boardRef} summary={summary} squad={squad} clubStyle={clubStyle} />
      </div>

      <div className="rounded-[12px] border border-line bg-white/[0.03] p-3">
        <div className="mb-3 px-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Share club</p>
          <p className="mt-1 text-sm text-ink-dim">{summary.fullName} Starting XI</p>
        </div>

        <div className="flex w-full flex-col gap-[10px]">
          <div className="rounded-lg border border-line bg-black/25 p-2">
            <p className="mb-2 px-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Club style</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(CLUB_STYLES) as ClubStyle[]).map((style) => {
                const item = CLUB_STYLES[style];
                const selected = clubStyle === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setClubStyle(style)}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-md border text-[12px] font-semibold transition hover:bg-white/[0.06]"
                    style={{
                      borderColor: selected ? item.accent : "rgba(255,255,255,.09)",
                      color: selected ? item.accent : "rgba(237,237,237,.72)",
                      background: selected ? item.glow : "rgba(255,255,255,.02)",
                    }}
                  >
                    <span className="size-2 rounded-full" style={{ background: item.accent }} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {canNativeShare && (
            <button
              type="button"
              onClick={nativeShare}
              className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-[#d4af37]/70 bg-[#d4af37] text-[14px] font-semibold tracking-[-.01em] text-black transition-all duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[.99]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              />
              <Share2 size={18} strokeWidth={2.5} className="relative" />
              <span className="relative">Share my club</span>
            </button>
          )}

          <div className="grid w-full grid-cols-3 gap-[8px]">
            <button type="button" onClick={() => window.open(intentUrl("x", summary), "_blank", "noopener,noreferrer")} className={actionButton}>
              <XLogo size={15} />
              <span className="max-[360px]:hidden">X</span>
            </button>
            <button type="button" onClick={() => window.open(intentUrl("linkedin", summary), "_blank", "noopener,noreferrer")} className={actionButton}>
              <LinkedInLogo size={15} />
              <span className="max-[360px]:hidden">LinkedIn</span>
            </button>
            <button type="button" onClick={copyLink} className={actionButton}>
              {linkCopied ? <Check size={15} className="text-brand" /> : <Link2 size={15} />}
              <span className="max-[360px]:hidden">{linkCopied ? "Copied" : "Copy link"}</span>
            </button>
          </div>

          <div className="grid w-full grid-cols-[1.6fr_1fr] gap-[8px]">
            <button
              type="button"
              onClick={downloadBoard}
              disabled={busy === "download"}
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-[#d4af37]/45 bg-[#d4af37]/10 py-[11px] text-[13px] font-semibold tracking-[-.01em] text-[#f1cf7a] transition-all duration-150 ease-out hover:-translate-y-px hover:border-[#d4af37]/80 hover:bg-[#d4af37]/15 active:translate-y-0 active:scale-[.99] disabled:opacity-60"
            >
              {busy === "download" ? (
                <span className="h-[15px] w-[15px] animate-spin rounded-full border-[1.5px] border-[#d4af37]/30 border-t-[#d4af37]" />
              ) : done === "download" ? (
                <Check size={16} strokeWidth={2.6} />
              ) : (
                <Download size={16} strokeWidth={2.4} className="transition-transform group-hover:translate-y-[1px]" />
              )}
              {busy === "download" ? "Saving..." : done === "download" ? "Saved" : "Download"}
            </button>

            <button type="button" onClick={copyImage} disabled={busy === "copy-image"} className={actionButton}>
              {busy === "copy-image" ? (
                <span className="h-[13px] w-[13px] animate-spin rounded-full border-[1.5px] border-white/25 border-t-white/80" />
              ) : done === "copy-image" ? (
                <Check size={14} className="text-brand" />
              ) : (
                <Copy size={14} />
              )}
              {busy === "copy-image" ? "..." : done === "copy-image" ? "Copied" : "Copy image"}
            </button>
          </div>

          <button type="button" onClick={storyFormat} disabled={busy === "story"} className={actionButton}>
            {busy === "story" ? (
              <span className="h-[14px] w-[14px] animate-spin rounded-full border-[1.5px] border-white/25 border-t-white/80" />
            ) : done === "story" ? (
              <Check size={15} className="text-brand" />
            ) : (
              <ImageDown size={15} className="transition-colors group-hover:text-[#ff5a8a]" />
            )}
            {busy === "story" ? "Rendering..." : done === "story" ? "Done" : "Story format"}
          </button>

          {error && <p className="text-center text-[12px] leading-snug text-[#ff9d96]">{error}</p>}
        </div>
      </div>

      <div
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          overflow: "hidden",
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <StoryCanvas ref={storyRef} summary={summary} squad={squad} clubStyle={clubStyle} />
      </div>
    </div>
  );
}

const BoardCanvas = forwardRef<HTMLDivElement, Props & { clubStyle: ClubStyle }>(function BoardCanvas({ summary, squad, clubStyle }, ref) {
  const style = CLUB_STYLES[clubStyle];
  const average = squad.length
    ? Math.round(squad.reduce((total, member) => total + member.card.overall, 0) / squad.length)
    : 0;
  const totalContributions = squad.reduce((total, member) => total + member.contributions, 0);
  const statItems = [
    { label: "Stars", value: formatNumber(summary.stars) },
    { label: "Forks", value: formatNumber(summary.forks) },
    { label: "Squad", value: String(squad.length) },
    { label: "Avg OVR", value: average ? String(average) : "--" },
    { label: "Commits", value: formatNumber(totalContributions) },
  ];

  return (
    <div
      ref={ref}
      className="relative min-w-[920px] overflow-hidden rounded-[18px] border border-[#b88b48]/35 bg-black shadow-[0_35px_120px_-55px_rgba(0,0,0,.95)]"
      style={{
        aspectRatio: "1586 / 992",
        backgroundImage: "url('/repo-club/pitch-points.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute left-[3.2%] top-[3.2%] z-[2] flex max-w-[38%] flex-col rounded-[14px] border bg-black/82 px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,.38)]" style={{ borderColor: style.border }}>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: style.accent }}>
          FutClaw RepoClub
        </span>
        <span className="mt-1 truncate text-[20px] font-black leading-none tracking-[-0.03em] text-white">
          {summary.fullName}
        </span>
        <span className="mt-1 truncate text-[11px] font-medium text-white/62">
          {summary.language ?? "Mixed stack"} · 4-3-3 contributor XI
        </span>
      </div>

      <div className="pointer-events-none absolute right-[3.2%] top-[3.2%] z-[2] grid w-[47%] grid-cols-5 overflow-hidden rounded-[14px] border bg-black/84 shadow-[0_14px_34px_rgba(0,0,0,.42)]" style={{ borderColor: style.accentSoft }}>
        {statItems.map((item, index) => (
          <div
            key={item.label}
            className={[
              "flex min-h-[54px] flex-col justify-center px-2 text-center",
              index > 0 ? "border-l border-white/12" : "",
            ].join(" ")}
          >
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/46">
              {item.label}
            </span>
            <span className="mt-1 text-[19px] font-black leading-none tabular-nums text-white">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {squad.map((member, index) => (
        <PlayerSlot key={member.card.login} member={member} index={index} />
      ))}
    </div>
  );
});

const StoryCanvas = forwardRef<HTMLDivElement, Props & { clubStyle: ClubStyle }>(function StoryCanvas({ summary, squad, clubStyle }, ref) {
  const style = CLUB_STYLES[clubStyle];
  const average = squad.length
    ? Math.round(squad.reduce((total, member) => total + member.card.overall, 0) / squad.length)
    : 0;
  const totalContributions = squad.reduce((total, member) => total + member.contributions, 0);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: 1080,
        height: 1920,
        overflow: "hidden",
        background: "#000",
        fontFamily: "var(--font-geist), Geist, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/repo-club/story-pitch-points.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `linear-gradient(180deg, rgba(0,0,0,.34) 0%, ${style.glow} 23%, rgba(0,0,0,.02) 72%, rgba(0,0,0,.42) 100%)`,
        }}
      />
      <div style={{ position: "absolute", left: 88, right: 88, top: 92, color: "#fff" }}>
        <div style={{ fontSize: 28, letterSpacing: "0.22em", color: style.accent, textTransform: "uppercase", fontWeight: 800 }}>
          FutClaw RepoClub
        </div>
        <div style={{ marginTop: 16, fontSize: 76, fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em" }}>
          {summary.fullName}
        </div>
        <div style={{ marginTop: 18, display: "flex", gap: 12, color: "#fff" }}>
          {[
            ["Stars", formatNumber(summary.stars)],
            ["Forks", formatNumber(summary.forks)],
            ["XI", String(squad.length)],
            ["Avg OVR", average ? String(average) : "--"],
            ["Commits", formatNumber(totalContributions)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                minWidth: 116,
                border: `1px solid ${style.accentSoft}`,
                borderRadius: 12,
                background: "rgba(0,0,0,.58)",
                padding: "13px 14px",
              }}
            >
              <div style={{ fontSize: 13, letterSpacing: "0.16em", color: "rgba(255,255,255,.48)", textTransform: "uppercase" }}>
                {label}
              </div>
              <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900, lineHeight: 1 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0 }}>
        {squad.map((member, index) => (
          <StoryPlayerSlot key={member.card.login} member={member} index={index} />
        ))}
      </div>
    </div>
  );
});

function StoryPlayerSlot({ member, index }: { member: SquadMember; index: number }) {
  const slot = STORY_SLOTS[index];
  if (!slot) return null;

  return (
    <a
      href={`/${member.card.login}`}
      style={{
        position: "absolute",
        zIndex: 4,
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width: 138,
        transform: "translate(-50%, -50%)",
        filter: "drop-shadow(0 24px 24px rgba(0,0,0,.72))",
      }}
    >
      <PlayerCard card={member.card} />
    </a>
  );
}

function PlayerSlot({ member, index, compact = false }: { member: SquadMember; index: number; compact?: boolean }) {
  const slot = SLOTS[index];
  if (!slot) return null;
  const width = compact ? "116px" : "clamp(80px, 8.7%, 126px)";

  return (
    <a
      href={`/${member.card.login}`}
      className="group absolute z-[4] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width,
      }}
    >
      <div className="w-full drop-shadow-[0_18px_24px_rgba(0,0,0,.72)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.035]">
        <PlayerCard card={member.card} />
      </div>
      {!compact && (
        <span className="sr-only">{slot.role} {member.card.login} {formatNumber(member.contributions)} commits</span>
      )}
    </a>
  );
}
