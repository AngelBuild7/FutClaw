"use client";

import { forwardRef, type CSSProperties } from "react";
import type { Card, CardThemeOverride, Finish } from "@/lib/scoring/types";
import PlayerCard from "./PlayerCard";
import { resolveCardTheme, resolveResultTheme } from "./finishTheme";

// Instagram Story canvas (9:16). The frame renders at native resolution: the
// captured PNG IS these pixels, so the on-page card's pixelRatio:3 upscale is
// unnecessary — CardActions captures the story at pixelRatio:1.
const STORY_W = 1080;
const STORY_H = 1920;

// Instagram overlays its own chrome on the top (~profile/close) of every story.
// Keep the small brand stamp inside this band while the generated background
// carries the footer watermark.
const SAFE_TOP = 170;

// Card width tuned for clean stadium backgrounds: big enough for story impact,
// small enough to leave the arena lights and footer watermark breathing room.
const CARD_W = 590;
const CARD_H = Math.round(CARD_W * (820 / 540)); // ≈ 920

// theme.glow is already an `rgba(r,g,b,a)` string (finishTheme.ts). Re-alpha it
// so we can reuse the tier hue at a chosen opacity for the room wash.
function rgbaGlow(glow: string, alpha: number): string {
  const m = glow.match(/rgba?\(([^)]+)\)/);
  if (!m) return glow;
  const [r, g, b] = m[1].split(",").map((s) => s.trim());
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const FONT_DISPLAY = "var(--font-geist), 'Geist', sans-serif";
const FONT_BOLD = "var(--font-din-bold), 'Saira Condensed', sans-serif";

const STORY_BACKGROUNDS: Record<Finish | CardThemeOverride, string> = {
  bronze: "/story/default.png",
  silver: "/story/default.png",
  gold: "/story/gold.png",
  icon: "/story/gold.png",
  totw: "/story/blue.png",
  toty: "/story/blue.png",
  founder: "/story/claw.png",
  claw: "/story/claw.png",
  midnight: "/story/blue.png",
};

function storyBackground(card: Card): string {
  return STORY_BACKGROUNDS[card.customization?.theme ?? card.finish] ?? STORY_BACKGROUNDS.silver;
}

// Archetype is the card's caption — one line, always. Long archetypes shrink
// rather than wrap into the CTA below. Deterministic length→size (no DOM
// measurement) keeps the off-screen capture stable.
function archetypeSize(label: string): number {
  const n = label.length;
  if (n <= 12) return 58;
  if (n <= 18) return 48;
  if (n <= 24) return 40;
  return 34;
}

// Hidden, fixed-size story canvas wrapping the existing PlayerCard. Mounted once
// (off-screen) in ResultView so renderCardImage can clone + capture it through
// the same proven pipeline as the card — no separate Satori layout, no second
// React root. PlayerCard itself is untouched (the FUT homage stays pure); all
// story styling lives in this frame.
const StoryFrame = forwardRef<HTMLDivElement, { card: Card }>(function StoryFrame(
  { card },
  ref,
) {
  const theme = resolveCardTheme(card);
  const accent = resolveResultTheme(card).ink;
  const archetype = card.archetype.toUpperCase();
  const bg = storyBackground(card);

  // Optical centring: a tall card true-centred reads low (the eye weights the
  // top + drop shadow), so the hero zone sits slightly high in the safe band.
  // Card top = safe top + top block + a measured gap.
  const cardTop = SAFE_TOP + 270;

  const abs = (top: number): CSSProperties => ({
    position: "absolute",
    left: 0,
    right: 0,
    top,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  });

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: "relative",
        width: STORY_W,
        height: STORY_H,
        overflow: "hidden",
        fontFamily: FONT_DISPLAY,
        backgroundImage: `url("${bg}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#000",
      }}
      className="futclaw-story-frame"
    >
      {/* Keep the generated background premium while preserving the footer
          watermark baked into the artwork. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(46% 36% at 50% 48%, transparent 0%, transparent 56%, rgba(0,0,0,0.20) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.36) 0%, transparent 18%, transparent 86%, rgba(0,0,0,0.10) 100%)
          `,
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 170,
          background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.90) 52%, rgba(0,0,0,0.98) 100%)",
        }}
      />

      {/* top — quiet brand stamp, not the loudest object in frame */}
      <div style={abs(SAFE_TOP - 60)}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: "rgba(255,255,255,0.92)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: accent,
              boxShadow: `0 0 18px ${accent}`,
            }}
          />
          FutClaw
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: FONT_DISPLAY,
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.40)",
            textTransform: "uppercase",
          }}
        >
          {card.platform === "youtube" ? "YouTube scout card" : "GitHub scout card"}
        </div>
      </div>

      {/* centre — the card, lit by a tier glow halo so it floats off the stage */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: cardTop,
          transform: "translateX(-50%)",
          width: CARD_W,
        }}
      >
        {/* Separator stack — what actually lifts the card off the stage on
            EVERY tier (red-on-red, grey-on-grey, navy-on-navy):
            (a) a dark "moat" that deepens the immediate surround, then
            (b) a tight tier-tinted rim glow hugging the card edges for colour
            lift, then (c) a strong drop shadow for depth. The card ends up the
            most saturated, brightest, edge-defined object in frame. */}
        <div
          style={{
            position: "absolute",
            inset: "-6%",
            borderRadius: "8%",
            background: "radial-gradient(closest-side, transparent 54%, rgba(0,0,0,0.58) 100%)",
            filter: "blur(24px)",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "-2%",
            borderRadius: "8%",
            background: `radial-gradient(closest-side, transparent 63%, ${rgbaGlow(theme.glow, 0.54)} 88%, transparent 100%)`,
            filter: "blur(14px)",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            filter: `drop-shadow(0 28px 56px rgba(0,0,0,0.78)) drop-shadow(0 0 1px rgba(255,255,255,0.20))`,
          }}
        >
          <PlayerCard card={card} />
        </div>
      </div>

      {/* archetype — the card's caption (one line, tier accent), tucked just
          below the card so it reads as the player's title. */}
      <div style={abs(cardTop + CARD_H + 30)}>
        <div
          style={{
            fontFamily: FONT_BOLD,
            fontSize: Math.max(28, archetypeSize(archetype) - 16),
            fontWeight: 700,
            letterSpacing: "0.01em",
            lineHeight: 1,
            color: accent,
            textShadow: "0 6px 26px rgba(0,0,0,0.72)",
            textAlign: "center",
            whiteSpace: "nowrap",
            maxWidth: STORY_W - 120,
          }}
        >
          {archetype}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 52,
          transform: "translateX(-50%)",
          padding: "9px 16px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.42)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
          fontFamily: FONT_DISPLAY,
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: "0.04em",
          color: "rgba(255,255,255,0.70)",
          whiteSpace: "nowrap",
        }}
      >
        Made with FutClaw • futclaw.com
      </div>

    </div>
  );
});

export default StoryFrame;
