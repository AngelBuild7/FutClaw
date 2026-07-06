import type { Card, CardThemeOverride } from "./scoring/types";

export const CARD_THEME_OVERRIDES: CardThemeOverride[] = ["bronze", "silver", "gold", "toty", "icon", "claw", "midnight"];

const HEX_RE = /^#?[0-9a-f]{6}$/i;
const MAX_DISPLAY_NAME = 24;

export function pickOverall(override: string | number | null | undefined, fallback: number): number {
  if (override === null || override === undefined || override === "") return fallback;
  const value = typeof override === "number" ? override : Number.parseInt(String(override), 10);
  return Number.isInteger(value) && value >= 1 && value <= 99 ? value : fallback;
}

export function pickTheme(override: string | null | undefined): CardThemeOverride | undefined {
  return CARD_THEME_OVERRIDES.includes(override as CardThemeOverride) ? (override as CardThemeOverride) : undefined;
}

export function pickAccent(override: string | null | undefined): string | undefined {
  if (!override || !HEX_RE.test(override)) return undefined;
  return `#${override.replace("#", "").toLowerCase()}`;
}

export function pickName(override: string | null | undefined, fallback: string): string {
  if (!override) return fallback;
  const value = override
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DISPLAY_NAME);
  return value || fallback;
}

export function applyCardOverrides(
  card: Card,
  overrides: {
    name?: string | null;
    country?: string;
    overall?: string | number | null;
    theme?: string | null;
    accent?: string | null;
  },
  pickCountry: (override: string | null | undefined, fallback: string) => string | null,
): Card {
  const theme = pickTheme(overrides.theme);
  const accent = pickAccent(overrides.accent);
  return {
    ...card,
    name: pickName(overrides.name, card.name),
    country: pickCountry(overrides.country, card.country) ?? "",
    overall: pickOverall(overrides.overall, card.overall),
    ...(theme || accent ? { customization: { theme, accent } } : {}),
  };
}
