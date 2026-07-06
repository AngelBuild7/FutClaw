import { describe, expect, it } from "vitest";

import type { RawPayload } from "@/lib/github/client";
import { signalsFromPayload } from "@/lib/github/signals";

const basePayload = (overrides: Partial<RawPayload> = {}): RawPayload => ({
  login: "orgdev",
  name: "Org Dev",
  avatarUrl: "https://example.com/avatar.png",
  bio: null,
  websiteUrl: null,
  url: "https://github.com/orgdev",
  twitterUsername: null,
  location: null,
  createdAt: "2020-01-01T00:00:00Z",
  followers: 10,
  publicRepos: 0,
  repos: [],
  recentCommitRepos: [],
  recentCommits: 0,
  recentPRs: 0,
  recentReviews: 0,
  recentIssues: 0,
  recentRestricted: 0,
  recentActiveDays: 0,
  lifetimeContributions: 0,
  ...overrides,
});

describe("signalsFromPayload language diversity", () => {
  it("counts languages from public org repos the user recently committed to", () => {
    const signals = signalsFromPayload(
      basePayload({
        recentCommitRepos: [
          {
            name: "design-system",
            description: null,
            url: "https://github.com/acme/design-system",
            stars: 0,
            language: "TypeScript",
            createdAt: "2024-01-01T00:00:00Z",
            pushedAt: "2026-01-01T00:00:00Z",
            recentCommits: 14,
          },
          {
            name: "api",
            description: null,
            url: "https://github.com/acme/api",
            stars: 0,
            language: "Go",
            createdAt: "2024-01-01T00:00:00Z",
            pushedAt: "2026-01-01T00:00:00Z",
            recentCommits: 7,
          },
        ],
      }),
      Date.parse("2026-07-06T00:00:00Z"),
    );

    expect(signals.languages).toBe(2);
    expect(signals.rankedLanguages).toEqual(["Go", "TypeScript"]);
    expect(signals.topLanguage).toBe("Go");
  });

  it("ignores one-off commit repos for language diversity", () => {
    const signals = signalsFromPayload(
      basePayload({
        recentCommitRepos: [
          {
            name: "drive-by",
            description: null,
            url: "https://github.com/acme/drive-by",
            stars: 0,
            language: "Rust",
            createdAt: "2024-01-01T00:00:00Z",
            pushedAt: "2026-01-01T00:00:00Z",
            recentCommits: 1,
          },
        ],
      }),
      Date.parse("2026-07-06T00:00:00Z"),
    );

    expect(signals.languages).toBe(0);
    expect(signals.rankedLanguages).toEqual([]);
  });
});
