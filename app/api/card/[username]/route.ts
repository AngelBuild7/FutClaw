import { type GithubError } from "@/lib/github/client";
import { scoutCard } from "@/lib/scout";
import { pickFlag } from "@/lib/flagPriority";
import { applyCardOverrides } from "@/lib/cardOverrides";
import { recordScout } from "@/lib/analytics";
import { recordPublicScout } from "@/lib/community";
import { after } from "next/server";
import type { Card } from "@/lib/scoring/types";

type ScoutPlatform = "github" | "youtube";

// Resolve the card's flag by priority (override → GitHub). No IP/geo fallback —
// an unknown country shows no flag rather than the viewer's own.
function resolveDisplayCard(card: Card, searchParams: URLSearchParams): Card {
  return applyCardOverrides(
    card,
    {
      country: searchParams.get("country") ?? undefined,
      overall: searchParams.get("overall"),
      theme: searchParams.get("theme"),
      accent: searchParams.get("accent"),
    },
    pickFlag,
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const searchParams = new URL(req.url).searchParams;
  const platform: ScoutPlatform = searchParams.get("platform") === "youtube" ? "youtube" : "github";
  // scoutCard handles the Redis cache and the tokenless sample fallback; here we
  // just resolve the visitor's flag and record the scout after the response.
  try {
    const card = await scoutCard(username, platform);
    const displayCard = resolveDisplayCard(card, searchParams);
    after(async () => {
      await Promise.all([recordScout(), recordPublicScout(displayCard, platform === "youtube" ? "youtube-api" : "api")]);
    });
    return Response.json(displayCard);
  } catch (e) {
    const err = e as GithubError;
    const status =
      err.type === "notfound"
        ? 404
        : err.type === "invalid"
          ? 400
          : err.type === "ratelimit"
            ? 429
            : err.type === "config"
              ? 500
              : 502;
    return Response.json({ error: err.message ?? "Failed to scout that profile." }, { status });
  }
}
