import { describe, expect, it } from "vitest";
import type { Card } from "@/lib/scoring/types";
import { cardUrl, intentUrl, nativeSharePayload, shareMessage, shareText } from "@/lib/share";

// We test the share DECISIONS: correct platform endpoints, well-formed encoded
// URLs, stable per-login text, brag-led message. Not the React wiring.

const card = (over: Partial<Card> = {}): Card =>
  ({
    login: "torvalds",
    name: "Linus Torvalds",
    avatarUrl: "https://example.com/a.png",
    country: "us",
    club: "legends",
    stats: { pac: 74, sho: 97, pas: 90, dri: 69, def: 65, phy: 96 },
    position: "ST",
    family: "Forward",
    baseOVR: 88,
    overall: 95,
    finish: "icon",
    finishLabel: "ICON",
    archetype: "Galáctico",
    archetypeBlurb: "hall-of-fame maintainer",
    legacy: { L: 1 },
    report: {
      skillMoves: 3,
      weakFoot: 4,
      workRate: { attack: "High", defense: "Med" },
      style: "Relentless",
      reasons: { skillMoves: "", weakFoot: "", workRate: "", style: "" },
      playstyles: [],
      metrics: [],
    },
    ...over,
  }) as Card;

describe("share service", () => {
  it("builds the canonical card URL from the login, encoding the displayed flag", () => {
    expect(cardUrl(card())).toBe("https://futclaw.com/torvalds?country=us");
  });

  it("builds YouTube card URLs under the YouTube route", () => {
    expect(cardUrl(card({ platform: "youtube", login: "mkbhd" }), { canonicalCountry: "us" })).toBe(
      "https://futclaw.com/youtube/mkbhd",
    );
  });

  it("omits the country param when the card has no flag", () => {
    expect(cardUrl(card({ country: "" }))).toBe("https://futclaw.com/torvalds");
  });

  it("omits visual overrides that match the canonical scouted values", () => {
    expect(cardUrl(card(), { canonicalCountry: "us", canonicalOverall: 95 })).toBe("https://futclaw.com/torvalds");
  });

  it("encodes visual overrides that differ from the canonical scouted values", () => {
    expect(cardUrl(card({ overall: 10 }), { canonicalCountry: "us", canonicalOverall: 95 })).toBe(
      "https://futclaw.com/torvalds?overall=10",
    );
    expect(cardUrl(card({ country: "br", overall: 10 }), { canonicalCountry: "us", canonicalOverall: 95 })).toBe(
      "https://futclaw.com/torvalds?country=br&overall=10",
    );
  });

  it("encodes display name overrides that differ from the canonical profile name", () => {
    expect(cardUrl(card({ name: "De Ruwe" }), { canonicalName: "Dante De Ruwe", canonicalCountry: "us", canonicalOverall: 95 })).toBe(
      "https://futclaw.com/torvalds?name=De+Ruwe",
    );
  });

  it("encodes theme and accent customization in card URLs", () => {
    expect(
      cardUrl(card({ customization: { theme: "claw", accent: "#e2162a" } }), {
        canonicalCountry: "us",
        canonicalOverall: 95,
      }),
    ).toBe("https://futclaw.com/torvalds?theme=claw&accent=e2162a");
  });

  it("X intent uses /intent/tweet (NOT /intent/post) and carries url + hashtag", () => {
    const u = intentUrl("x", card());
    expect(u).toContain("https://twitter.com/intent/tweet?");
    expect(u).not.toContain("/intent/post");
    expect(u).toContain("hashtags=FutClaw");
    expect(u).toContain(encodeURIComponent("https://futclaw.com/torvalds?country=us"));
  });

  it("LinkedIn intent uses share-offsite with only the url (preview from OG)", () => {
    const u = intentUrl("linkedin", card());
    expect(u).toContain("linkedin.com/sharing/share-offsite/?url=");
    expect(u).toContain(encodeURIComponent("https://futclaw.com/torvalds?country=us"));
  });

  it("WhatsApp intent puts text + url in the message", () => {
    const u = intentUrl("whatsapp", card());
    expect(u).toContain("api.whatsapp.com/send?text=");
    expect(decodeURIComponent(u)).toContain("futclaw.com/torvalds?country=us");
  });

  it("share text is deterministic per login and mentions the rating", () => {
    const a = shareText(card());
    const b = shareText(card());
    expect(a).toBe(b);
    expect(a).toContain("95");
  });

  it("different logins can select different lines", () => {
    const a = shareText(card({ login: "torvalds" }));
    const b = shareText(card({ login: "sindresorhus" }));
    // both are valid lines; at least one should differ across a sample of logins
    const c = shareText(card({ login: "gaearon" }));
    expect(new Set([a, b, c]).size).toBeGreaterThan(1);
  });

  it("native payload carries title, brag-led text, and url", () => {
    const p = nativeSharePayload(card());
    expect(p.title).toBe("FutClaw");
    expect(p.url).toBe("https://futclaw.com/torvalds?country=us");
    expect(p.text).toBe(shareMessage(card()));
    expect(p.text).toContain("get scouted");
  });

  it("share message is the text plus the CTA", () => {
    expect(shareMessage(card())).toContain(shareText(card()));
  });
});
