import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import Background from "@/components/Background";
import { scoutCard } from "@/lib/scout";
import { pickFlag } from "@/lib/flagPriority";
import { applyCardOverrides } from "@/lib/cardOverrides";
import { recordScout } from "@/lib/analytics";
import { recordPublicScout } from "@/lib/community";
import type { YoutubeError } from "@/lib/youtube/client";
import type { Card } from "@/lib/scoring/types";
import ScoutRoute from "@/app/u/[username]/ScoutRoute";

export const dynamic = "force-dynamic";

const loadCard = cache(
  async (username: string): Promise<{ card: Card } | { error: { type: string; message: string } }> => {
    try {
      return { card: await scoutCard(username, "youtube") };
    } catch (e) {
      const err = e as Partial<YoutubeError>;
      return { error: { type: err.type ?? "scout_error", message: err.message ?? "Could not scout that channel." } };
    }
  },
);

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const res = await loadCard(username);
  if ("card" in res) {
    return {
      title: `${res.card.name} — ${res.card.overall} ${res.card.finishLabel} · FutClaw`,
      description: `${res.card.name} scouted on FutClaw: ${res.card.overall} OVR ${res.card.position}, ${res.card.archetype}.`,
      alternates: { canonical: `/youtube/${res.card.login}` },
      twitter: { card: "summary_large_image" },
    };
  }
  return { title: `@${username} · FutClaw`, robots: { index: false } };
}

function NotScouted({ username, error }: { username: string; error: { type: string; message: string } }) {
  return (
    <main className="relative z-[2] mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-6 text-center">
      <div className="font-display text-[12px] font-bold tracking-[.3em] text-brand">SCOUT REPORT</div>
      <h1 className="font-display mt-3 text-[clamp(30px,6vw,48px)] font-black leading-[.95]">No file found</h1>
      <p className="mt-3 text-[15.5px] leading-[1.5] text-ink-soft">
        {error.type === "notfound"
          ? `There's no YouTube channel named @${username}.`
          : `Could not scout @${username}. ${error.message}`}
      </p>
      <Link
        href="/"
        className="font-display mt-7 inline-flex h-[46px] items-center rounded-xl bg-brand px-6 text-[16px] tracking-[.06em] text-[#04130a] transition hover:bg-brand-hi"
      >
        SCOUT SOMEONE ELSE
      </Link>
    </main>
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ country?: string; overall?: string; theme?: string; accent?: string }>;
}) {
  const { username } = await params;
  const overrides = await searchParams;
  const res = await loadCard(username);
  const card: Card | null = "card" in res ? res.card : null;
  const canonicalCountry = card ? pickFlag(null, card.country) ?? "" : "";
  const canonicalOverall = card?.overall ?? 0;
  const displayCard = card ? applyCardOverrides(card, overrides, pickFlag) : null;
  if (displayCard) {
    after(async () => {
      await Promise.all([recordScout(), recordPublicScout(displayCard, "youtube-page")]);
    });
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-ink">
      <Background />
      {displayCard ? (
        <ScoutRoute card={displayCard} canonicalCountry={canonicalCountry} canonicalOverall={canonicalOverall} />
      ) : (
        <NotScouted username={username} error={(res as { error: { type: string; message: string } }).error} />
      )}
    </div>
  );
}
