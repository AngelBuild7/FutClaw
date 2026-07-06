export type CardImageSize = "sm" | "md" | "lg";

export const CARD_IMAGE_WIDTHS: Record<CardImageSize, number> = {
  sm: 360,
  md: 540,
  lg: 810,
};

export function pickCardImageSize(value: string | null | undefined): CardImageSize {
  return value === "sm" || value === "lg" ? value : "md";
}

export function cardImageHeight(width: number): number {
  return Math.round((width * 820) / 540);
}
