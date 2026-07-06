import { describe, expect, it } from "vitest";
import { resolveCardTheme, resolveResultTheme } from "@/components/card/finishTheme";
import type { Card } from "@/lib/scoring/types";

const card = (over: Partial<Card> = {}): Card =>
  ({
    login: "octocat",
    name: "The Octocat",
    avatarUrl: "https://example.com/a.png",
    country: "us",
    club: "neutral",
    stats: { pac: 70, sho: 71, pas: 72, dri: 73, def: 74, phy: 75 },
    position: "CM",
    family: "Playmaker",
    baseOVR: 72,
    overall: 76,
    finish: "gold",
    finishLabel: "GOLD",
    archetype: "Regista",
    archetypeBlurb: "deep playmaker",
    legacy: { L: 0.3 },
    report: {
      skillMoves: 3,
      weakFoot: 3,
      workRate: { attack: "Med", defense: "Med" },
      style: "Balanced",
      reasons: { skillMoves: "", weakFoot: "", workRate: "", style: "" },
      playstyles: [],
      metrics: [],
    },
    ...over,
  }) as Card;

describe("finish themes", () => {
  it("uses the scored finish by default", () => {
    expect(resolveCardTheme(card()).bg).toBe("/cards/gold.png");
  });

  it("uses the calmer scout skin for scored icon cards", () => {
    const c = card({ finish: "icon", finishLabel: "ICON" });
    expect(resolveCardTheme(c).bg).toBe("/cards/toty.webp");
    expect(resolveResultTheme(c).ink).toBe("#9db7ff");
  });

  it("lets URL customization override the card skin", () => {
    expect(resolveCardTheme(card({ customization: { theme: "claw" } })).bg).toBe("/cards/founder-red.png");
    expect(resolveCardTheme(card({ customization: { theme: "gold" } })).bg).toBe("/cards/gold.png");
    expect(resolveCardTheme(card({ customization: { theme: "icon" } })).bg).toBe("/cards/legend.png");
  });

  it("lets accent override glow and result ink without changing skin", () => {
    const c = card({ customization: { theme: "gold", accent: "#e2162a" } });
    expect(resolveCardTheme(c).bg).toBe("/cards/gold.png");
    expect(resolveCardTheme(c).glow).toBe("rgba(226, 22, 42, 0.55)");
    expect(resolveResultTheme(c).ink).toBe("#e2162a");
  });
});
