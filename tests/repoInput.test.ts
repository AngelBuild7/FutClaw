import { describe, expect, it } from "vitest";
import { parseRepoInput } from "@/lib/github/repoInput";

describe("parseRepoInput", () => {
  it("accepts plain owner/repo input", () => {
    expect(parseRepoInput("vercel/next.js")).toEqual({ owner: "vercel", repo: "next.js" });
  });

  it("accepts full GitHub URLs", () => {
    expect(parseRepoInput("https://github.com/vercel/next.js")).toEqual({ owner: "vercel", repo: "next.js" });
    expect(parseRepoInput("github.com/facebook/react/")).toEqual({ owner: "facebook", repo: "react" });
    expect(parseRepoInput("https://www.github.com/nodejs/node?tab=readme")).toEqual({
      owner: "nodejs",
      repo: "node",
    });
  });

  it("accepts clone URLs and strips .git", () => {
    expect(parseRepoInput("https://github.com/vercel/next.js.git")).toEqual({ owner: "vercel", repo: "next.js" });
    expect(parseRepoInput("git@github.com:facebook/react.git")).toEqual({ owner: "facebook", repo: "react" });
  });

  it("rejects invalid or non-GitHub input", () => {
    expect(parseRepoInput("https://gitlab.com/vercel/next.js")).toBeNull();
    expect(parseRepoInput("vercel")).toBeNull();
    expect(parseRepoInput("bad owner/repo")).toBeNull();
    expect(parseRepoInput("")).toBeNull();
  });
});
