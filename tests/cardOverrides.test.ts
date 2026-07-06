import { describe, expect, it } from "vitest";
import { applyCardOverrides, pickAccent, pickName, pickOverall, pickTheme } from "@/lib/cardOverrides";
import type { Card } from "@/lib/scoring/types";

describe("card overrides", () => {
  it("accepts valid display overall overrides", () => {
    expect(pickOverall("1", 72)).toBe(1);
    expect(pickOverall("99", 72)).toBe(99);
    expect(pickOverall(10, 72)).toBe(10);
  });

  it("falls back when overall overrides are invalid", () => {
    expect(pickOverall(null, 72)).toBe(72);
    expect(pickOverall("", 72)).toBe(72);
    expect(pickOverall("0", 72)).toBe(72);
    expect(pickOverall("100", 72)).toBe(72);
    expect(pickOverall("lol", 72)).toBe(72);
  });

  it("accepts known theme overrides only", () => {
    expect(pickTheme("gold")).toBe("gold");
    expect(pickTheme("claw")).toBe("claw");
    expect(pickTheme("unknown")).toBeUndefined();
  });

  it("normalizes valid accent colors", () => {
    expect(pickAccent("E2162A")).toBe("#e2162a");
    expect(pickAccent("#39d353")).toBe("#39d353");
    expect(pickAccent("red")).toBeUndefined();
    expect(pickAccent("#fff")).toBeUndefined();
  });

  it("accepts a display name override and trims unsafe whitespace", () => {
    expect(pickName("  De   Ruwe  ", "Dante De Ruwe")).toBe("De Ruwe");
    expect(pickName("\n", "Dante De Ruwe")).toBe("Dante De Ruwe");
  });

  it("applies display name overrides without changing the login", () => {
    const card = {
      login: "dantederuwe",
      name: "Dante De Ruwe",
      country: "be",
      overall: 80,
      customization: undefined,
    } as Card;
    const next = applyCardOverrides(card, { name: "De Ruwe" }, (_override, fallback) => fallback);
    expect(next.login).toBe("dantederuwe");
    expect(next.name).toBe("De Ruwe");
  });
});
