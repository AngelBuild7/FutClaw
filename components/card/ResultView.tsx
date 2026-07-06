"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Card } from "@/lib/scoring/types";
import PlayerCard from "./PlayerCard";
import StoryFrame from "./StoryFrame";
import CardActions from "./CardActions";
import FlagPicker from "./FlagPicker";
import OverallPicker from "./OverallPicker";
import CustomizationPicker, { type CardCustomization } from "./CustomizationPicker";
import Mascot from "./Mascot";
import FooterCredit from "./FooterCredit";
import HowItWorksModal from "./HowItWorksModal";
import { AttributesPanel, MetricsPanel, ReportHeader } from "./ScoutReport";
import { resolveResultTheme } from "./finishTheme";
import { useReveal } from "@/hooks/useReveal";
import { burstConfetti } from "@/lib/confetti";

interface Props {
  card: Card;
  onBack: () => void;
  /** Edit the card's flag from the report (click-the-flag picker). */
  onCountryChange: (code: string) => void;
  /** Edit the displayed card rating; the scouted rating remains canonical. */
  onOverallChange: (overall: number) => void;
  /** Edit visual-only card theme/accent overrides. */
  onCustomizationChange: (customization: CardCustomization) => void;
  /** GitHub-derived flag; share links only carry ?country= when it's overridden. */
  canonicalCountry?: string;
  /** Scouted rating; share links only carry ?overall= when it's overridden. */
  canonicalOverall: number;
}

// Card width scales with the viewport but is bounded by BOTH width and height
// (and a hard min/max) so it never overflows a narrow phone or a short laptop.
const CARD_WIDTH = "clamp(220px, min(80vw, 40vh), 332px)";

// Confetti palette per tier — gold for prestige, green always woven in (brand).
const CONFETTI: Record<string, string[]> = {
  toty: ["#e9cc74", "#d4af37", "#7fa8ff", "#ffffff", "#39d353"],
  icon: ["#e9cc74", "#d4af37", "#f5f0e1", "#ffffff", "#39d353"],
  totw: ["#39d353", "#e9cc74", "#ffffff", "#7fa8ff"],
};

export default function ResultView({
  card,
  onBack,
  onCountryChange,
  onOverallChange,
  onCustomizationChange,
  canonicalCountry = "",
  canonicalOverall,
}: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const theme = resolveResultTheme(card);
  const phase = useReveal(card.finish);
  const [modalOpen, setModalOpen] = useState(false);

  // BACK when the visitor came from home this tab; otherwise (direct / shared
  // link) a CTA to make their own card. Default to the CTA so share-link
  // visitors — the growth case — see it without a flash.
  const [seenHome, setSeenHome] = useState(false);
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("futclaw:seen-home") === "1";
    } catch {}
    // Deferred (not a synchronous set-in-effect) so it can't cascade a render.
    const t = setTimeout(() => setSeenHome(seen), 0);
    return () => clearTimeout(t);
  }, []);

  // Fire confetti when the rare-tier reveal hits its burst. Founders burst in
  // their own accent (woven with brand green); other tiers use the palette map.
  useEffect(() => {
    if (phase === "burst") {
      const palette = card.founder
        ? [card.founder.accent, "#ffffff", "#39d353"]
        : (CONFETTI[card.finish] ?? ["#39d353", "#e9cc74", "#ffffff"]);
      burstConfetti(palette);
    }
  }, [phase, card.finish, card.founder]);

  const ignited = phase === "ignite" || phase === "burst" || phase === "freeze";

  return (
    <>
    <main className="relative z-[2] mx-auto flex min-h-[100dvh] w-full max-w-[1440px] flex-col px-[clamp(14px,3vw,28px)] py-[clamp(16px,3vw,28px)]">
      {/* Tier-reactive backdrop: dims the global green wash and lets the card's
          own tier color own the result screen (green is the action, the card is
          the prize — they shouldn't fight here). Fades in with the reveal. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(900px 520px at 50% -12%, ${theme.glow}, transparent 62%), radial-gradient(760px 520px at 92% 10%, rgba(255,255,255,.035), transparent 60%), #000000`,
          opacity: ignited ? 1 : 0.82,
          transition: "opacity 1s ease",
        }}
      />

      <section className="relative flex min-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[28px] border border-line bg-[#050505]/86 shadow-[0_40px_140px_-70px_rgba(0,0,0,.95),inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${theme.ink}70, transparent)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-170px] h-[300px] w-[680px] -translate-x-1/2 rounded-full blur-[72px]"
          style={{ background: `radial-gradient(closest-side, ${theme.glow}, transparent 72%)`, opacity: ignited ? 0.42 : 0.24 }}
        />

      <div className="relative z-[2] flex w-full shrink-0 items-center justify-between gap-3 border-b border-line px-[clamp(16px,3vw,32px)] py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={
              seenHome
                ? "group inline-flex items-center gap-2 rounded-full border border-transparent px-2 py-1 text-[13px] font-medium text-ink-faint transition hover:border-line hover:text-ink"
                : "group inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-[13px] font-semibold text-ink transition hover:border-white/25 hover:bg-white/[0.06]"
            }
          >
            {seenHome ? (
              <>
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                BACK
              </>
            ) : (
              <>
                <ArrowLeft size={16} className="transition-transform group-hover:translate-x-0.5" />
                GET SCOUTED
              </>
            )}
          </button>
          <Mascot size={34} kick={false} ball={false} animate={false} />
        </div>
        <div className="flex items-center gap-3 justify-end">
          <CustomizationPicker value={card.customization} onChange={onCustomizationChange} />
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="cursor-pointer text-[12.5px] font-medium text-ink-faint underline-offset-2 transition hover:text-ink hover:underline max-[420px]:hidden"
          >
            how it works ↗
          </button>
        </div>
      </div>

      <div className="relative z-[1] shrink-0 border-b border-line px-[clamp(16px,3vw,36px)] py-[clamp(18px,3vw,30px)]">
        <ReportHeader card={card} />
      </div>

      <div className="relative z-[1] grid flex-1 grid-cols-[minmax(260px,360px)_auto_minmax(260px,390px)] items-start justify-center gap-[clamp(18px,3vw,44px)] px-[clamp(16px,3vw,36px)] py-[clamp(20px,4vw,38px)] max-[1100px]:flex max-[1100px]:flex-col max-[1100px]:items-center">
        {/* left — attributes + playstyles */}
        <div className="flex w-full justify-end max-[1100px]:order-2 max-[1100px]:max-w-[520px] max-[1100px]:justify-center">
          <div className="w-full">
            <AttributesPanel card={card} />
          </div>
        </div>

        {/* center — the card + actions (the walkout happens here) */}
        <div className="relative flex flex-col items-center gap-[clamp(12px,2vh,18px)] max-[1100px]:order-1">
          {/* spotlight wash — a soft, diffuse glow from above as the card rises.
              Reduced + blurred so it reads as ambient light, not a hard beam. */}
          <div
            className="animate-spotlight pointer-events-none absolute left-1/2 top-[-10%] z-0 h-[70%] w-[120%] blur-[40px]"
            style={{
              background: `radial-gradient(60% 70% at 50% 0%, ${theme.glow}, transparent 72%)`,
              opacity: ignited ? 0.28 : 0,
              transition: "opacity .5s ease",
            }}
          />
          {/* card stage — holds the captured card AND the flag editor as siblings.
              The editor overlays the flag slot but lives OUTSIDE captureRef, so the
              downloaded/copied PNG never includes the picker UI. */}
          <div className="animate-walkout relative" style={{ width: CARD_WIDTH }}>
            <div ref={captureRef} className="relative">
              {/* tier glow that ignites on reveal */}
              <div
                className="animate-glow pointer-events-none absolute -inset-[12%] z-0 rounded-full blur-[20px]"
                style={{
                  background: `radial-gradient(closest-side, ${theme.glow}, transparent 72%)`,
                  opacity: ignited ? 0.72 : 0,
                  transition: "opacity .6s ease",
                }}
              />
              <div className="relative z-[1]">
                <PlayerCard card={card} />
              </div>
            </div>
            <FlagPicker value={card.country} onChange={onCountryChange} />
            <OverallPicker value={card.overall} canonicalValue={canonicalOverall} onChange={onOverallChange} />
          </div>
          <div style={{ width: CARD_WIDTH }}>
            <CardActions
              card={card}
              targetRef={captureRef}
              storyRef={storyRef}
              canonicalCountry={canonicalCountry}
              canonicalOverall={canonicalOverall}
            />
          </div>
        </div>

        {/* right — scouting metrics */}
        <div className="flex w-full max-[1100px]:order-3 max-[1100px]:max-w-[520px] max-[1100px]:justify-center">
          <div className="w-full">
            <MetricsPanel card={card} />
          </div>
        </div>
      </div>

      <footer className="relative z-[2] mt-auto flex flex-none items-center justify-center border-t border-line p-[clamp(12px,2.6vh,20px)]">
        <FooterCredit />
      </footer>
      </section>

      {/* Off-screen story canvas (1080×1920). Parked in a 0×0 clip holder at the
          viewport origin — NOT display:none — so its card art/avatar/fonts paint
          and decode, letting renderCardImage clone + capture it for the Story
          download/share. Same off-screen technique as lib/capture.ts. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          overflow: "hidden",
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <StoryFrame ref={storyRef} card={card} />
      </div>
    </main>

    {modalOpen && <HowItWorksModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
