import type { Card } from "@/lib/scoring/types";

// Share service — a pure module that, given a card, produces the share text and
// per-platform intent URLs. No DOM, no side effects; the React layer wires the
// gestures (native share sheet, window.open). Tested in isolation.

export type SharePlatform = "x" | "linkedin" | "whatsapp";
export interface ShareUrlOptions {
  canonicalName?: string;
  canonicalCountry?: string;
  canonicalOverall?: number;
}

const SITE = "https://futclaw.com";

// Deterministic line per login (FNV-1a) so a given user always gets the same
// brag — leads with the flex, leaves room for the user's own comment.
const lines = (c: Card): string[] =>
  c.platform === "youtube"
    ? [
        `apparently i'm a ${c.overall}-rated ${c.position}. my uploads do numbers, my cardio does not.`,
        `${c.finishLabel.toLowerCase()} finish, ${c.overall} overall. peaked, and it was on youtube.`,
        `pulled a ${c.overall} overall off my youtube channel. content national team, where you at.`,
        `${c.overall} overall ${c.position}, ${c.archetype}. recorded different, uploaded different.`,
        `got carded at ${c.overall} overall. the scouts (nobody) are calling.`,
        `turns out uploading videos makes you a ${c.overall}-rated baller. who knew.`,
      ]
    : [
        `apparently i'm a ${c.overall}-rated ${c.position}. my commits do numbers, my cardio does not.`,
        `${c.finishLabel.toLowerCase()} finish, ${c.overall} overall. peaked, and it was on github.`,
        `pulled a ${c.overall} overall off my github. open source national team, where you at.`,
        `${c.overall} overall ${c.position}, ${c.archetype}. built different, deployed different.`,
        `got carded at ${c.overall} overall. the scouts (nobody) are calling.`,
        `turns out shipping code makes you a ${c.overall}-rated baller. who knew.`,
      ];

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// Encode the displayed flag in the share link so the recipient's card matches
// what the sharer saw (the page re-applies it; an absent/invalid code just
// falls back to the GitHub-derived default).
export function cardUrl(card: Card, options: ShareUrlOptions = {}): string {
  const base = card.platform === "youtube" ? `${SITE}/youtube/${card.login}` : `${SITE}/${card.login}`;
  const params = new URLSearchParams();
  if (options.canonicalName !== undefined && card.name !== options.canonicalName) {
    params.set("name", card.name);
  }
  if (card.country && card.country !== options.canonicalCountry) {
    params.set("country", card.country);
  }
  if (options.canonicalOverall !== undefined && card.overall !== options.canonicalOverall) {
    params.set("overall", String(card.overall));
  }
  if (card.customization?.theme) {
    params.set("theme", card.customization.theme);
  }
  if (card.customization?.accent) {
    params.set("accent", card.customization.accent.replace("#", ""));
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function shareText(card: Card): string {
  const pool = lines(card);
  return pool[hash(card.login) % pool.length];
}

// Full sentence used as the native-share payload / pre-filled tweet body.
export function shareMessage(card: Card): string {
  return `${shareText(card)}\n\nget scouted →`;
}

// Per-platform intent URLs. X uses /intent/tweet (NOT /intent/post — the latter
// loops on mobile). LinkedIn honors only the url; its preview comes from OG tags.
export function intentUrl(platform: SharePlatform, card: Card, options: ShareUrlOptions = {}): string {
  const url = cardUrl(card, options);
  const text = shareMessage(card);
  switch (platform) {
    case "x":
      return (
        "https://twitter.com/intent/tweet?text=" +
        encodeURIComponent(text) +
        "&url=" +
        encodeURIComponent(url) +
        "&hashtags=FutClaw"
      );
    case "linkedin":
      return (
        "https://www.linkedin.com/sharing/share-offsite/?url=" +
        encodeURIComponent(url)
      );
    case "whatsapp":
      return (
        "https://api.whatsapp.com/send?text=" +
        encodeURIComponent(`${text} ${url}`)
      );
  }
}

// Native Web Share API payload (text + url; file added at call site for IG).
export function nativeSharePayload(card: Card, options: ShareUrlOptions = {}): { title: string; text: string; url: string } {
  return {
    title: "FutClaw",
    text: shareMessage(card),
    url: cardUrl(card, options),
  };
}

// Kept for backward-compat with any existing import.
export function shareUrl(card: Card): string {
  return intentUrl("x", card);
}
