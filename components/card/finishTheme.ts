import type { Card, CardThemeOverride, Finish } from "@/lib/scoring/types";

// hex (#rgb / #rrggbb) → rgba() string, so a founder's single accent hex can
// drive translucent glows/tints without hand-writing each alpha variant.
export function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Each finish maps to a FUT background image (public/cards), the text ink the
// Python generator uses for that card, a glow for the card's drop-shadow, and
// the avatar filter from the Claude Design card: avatarTint is a RADIAL tint —
// transparent in the centre so the photo shows clearly, ramping to the card
// colour toward the edges so they blend in; avatarHalo is the avatar's glow.
// totw reuses the TOTY art; icon uses the legend art.
export interface CardTheme {
  bg: string;
  ink: string;
  glow: string;
  avatarTint: string;
  avatarHalo: string;
}

export const CARD_THEME: Record<Finish, CardTheme> = {
  bronze: {
    bg: "/cards/bronze.png",
    ink: "#3a2717",
    glow: "rgba(190,120,60,.45)",
    avatarTint: "radial-gradient(ellipse 72% 76% at 52% 40%, transparent 46%, rgba(106,69,39,.26) 78%, rgba(50,31,14,.44))",
    avatarHalo: "rgba(214,163,110,.4)",
  },
  silver: {
    bg: "/cards/silver.png",
    ink: "#303536",
    glow: "rgba(170,188,210,.5)",
    avatarTint: "radial-gradient(ellipse 72% 76% at 52% 40%, transparent 46%, rgba(170,188,210,.22) 78%, rgba(70,78,90,.42))",
    avatarHalo: "rgba(220,228,238,.4)",
  },
  gold: {
    bg: "/cards/gold.png",
    ink: "#46390c",
    glow: "rgba(225,185,80,.55)",
    avatarTint: "radial-gradient(ellipse 72% 76% at 52% 40%, transparent 46%, rgba(243,214,121,.24) 78%, rgba(156,118,33,.44))",
    avatarHalo: "rgba(243,214,121,.45)",
  },
  totw: {
    bg: "/cards/toty.webp",
    ink: "#ebcd5b",
    glow: "rgba(90,140,255,.55)",
    avatarTint: "radial-gradient(ellipse 72% 76% at 52% 40%, transparent 46%, rgba(74,120,210,.22) 78%, rgba(14,35,80,.46))",
    avatarHalo: "rgba(127,168,255,.45)",
  },
  toty: {
    bg: "/cards/toty.webp",
    ink: "#ebcd5b",
    glow: "rgba(90,140,255,.55)",
    avatarTint: "radial-gradient(ellipse 72% 76% at 52% 40%, transparent 46%, rgba(74,120,210,.22) 78%, rgba(14,35,80,.46))",
    avatarHalo: "rgba(127,168,255,.45)",
  },
  icon: {
    bg: "/cards/legend.png",
    ink: "#625217",
    glow: "rgba(243,213,128,.5)",
    avatarTint: "radial-gradient(ellipse 72% 76% at 52% 40%, transparent 46%, rgba(243,214,121,.24) 78%, rgba(120,90,30,.46))",
    avatarHalo: "rgba(243,214,136,.5)",
  },
  // Fallback only — real founder cards carry per-person art/accent via
  // resolveCardTheme(); this keeps the Record<Finish> map total.
  founder: {
    bg: "/cards/founder-red.png",
    ink: "#f6f8fb",
    glow: "rgba(255,47,69,.55)",
    avatarTint: "radial-gradient(ellipse 72% 76% at 52% 40%, transparent 50%, rgba(0,0,0,.30))",
    avatarHalo: "rgba(255,47,69,.42)",
  },
};

const CLASSIC_ICON_CARD_THEME = CARD_THEME.icon;
const DEFAULT_ICON_CARD_THEME: CardTheme = {
  bg: "/cards/toty.webp",
  ink: "#f6f8fb",
  glow: "rgba(70,90,130,.58)",
  avatarTint: "radial-gradient(ellipse 72% 76% at 52% 40%, transparent 46%, rgba(20,28,48,.24) 78%, rgba(4,8,18,.52))",
  avatarHalo: "rgba(120,150,210,.42)",
};

export const CUSTOM_CARD_THEME: Record<CardThemeOverride, CardTheme> = {
  bronze: CARD_THEME.bronze,
  silver: CARD_THEME.silver,
  gold: CARD_THEME.gold,
  toty: CARD_THEME.toty,
  icon: CLASSIC_ICON_CARD_THEME,
  claw: {
    bg: "/cards/founder-red.png",
    ink: "#f6f8fb",
    glow: "rgba(255,47,69,.55)",
    avatarTint: "radial-gradient(ellipse 72% 76% at 52% 40%, transparent 50%, rgba(0,0,0,.30))",
    avatarHalo: "rgba(255,47,69,.42)",
  },
  midnight: {
    ...DEFAULT_ICON_CARD_THEME,
  },
};

// Per-card theme: identical to CARD_THEME for everyone except founders, who get
// their own art, a near-white ink, and a glow/halo derived from their accent.
export function resolveCardTheme(card: Card): CardTheme {
  const base = card.customization?.theme
    ? CUSTOM_CARD_THEME[card.customization.theme]
    : card.finish === "icon"
      ? DEFAULT_ICON_CARD_THEME
      : CARD_THEME[card.finish];
  const accent = card.customization?.accent;
  if (accent) {
    return {
      ...base,
      glow: rgba(accent, 0.55),
      avatarHalo: rgba(accent, 0.42),
    };
  }
  if (!card.founder || card.customization?.theme) return base;
  const a = card.founder.accent;
  return {
    bg: card.founder.art,
    ink: card.founder.ink ?? "#f6f8fb",
    glow: rgba(a, 0.55),
    avatarTint: "radial-gradient(ellipse 72% 76% at 52% 40%, transparent 50%, rgba(0,0,0,.30))",
    avatarHalo: rgba(a, 0.42),
  };
}

export interface ResultTheme {
  glow: string;
  chip: string;
  ink: string;
}

export const RESULT_THEME: Record<Finish, ResultTheme> = {
  bronze: { glow: "rgba(190,120,60,.34)", chip: "#2A1A0C", ink: "#F0CFA8" },
  silver: { glow: "rgba(170,188,210,.34)", chip: "#262B33", ink: "#D6DCE6" },
  gold: { glow: "rgba(225,185,80,.4)", chip: "#3A2806", ink: "#F3D679" },
  totw: { glow: "rgba(90,140,255,.5)", chip: "#10254F", ink: "#CADBFF" },
  toty: { glow: "rgba(90,140,255,.5)", chip: "#10254F", ink: "#CADBFF" },
  icon: { glow: "rgba(70,90,130,.42)", chip: "#0e1628", ink: "#9db7ff" },
  founder: { glow: "rgba(255,47,69,.4)", chip: "#221016", ink: "#ff6273" },
};

export const CUSTOM_RESULT_THEME: Record<CardThemeOverride, ResultTheme> = {
  bronze: RESULT_THEME.bronze,
  silver: RESULT_THEME.silver,
  gold: RESULT_THEME.gold,
  toty: RESULT_THEME.toty,
  icon: { glow: "rgba(243,213,128,.45)", chip: "#2A1A45", ink: "#F3D688" },
  claw: { glow: "rgba(255,47,69,.4)", chip: "#221016", ink: "#ff6273" },
  midnight: { glow: "rgba(70,90,130,.42)", chip: "#0e1628", ink: "#9db7ff" },
};

// Per-card result accent: founders tint the whole scout report to their own
// accent (red for Younes, chrome for Mawsis); everyone else uses RESULT_THEME.
export function resolveResultTheme(card: Card): ResultTheme {
  const base = card.customization?.theme ? CUSTOM_RESULT_THEME[card.customization.theme] : RESULT_THEME[card.finish];
  if (card.customization?.accent) {
    return { ink: card.customization.accent, glow: rgba(card.customization.accent, 0.34), chip: base.chip };
  }
  if (!card.founder || card.customization?.theme) return base;
  return { ink: card.founder.accent, glow: rgba(card.founder.accent, 0.34), chip: base.chip };
}
