import { after } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, GitFork, Star, Users } from "lucide-react";
import RepoClubBoard from "@/components/repo/RepoClubBoard";
import { type RepoError } from "@/lib/github/repo";
import { recordScout } from "@/lib/analytics";
import { recordRepoClub } from "@/lib/community";
import { buildRepoClub } from "@/lib/repoClub";

export const dynamic = "force-dynamic";

type PageParams = {
  owner: string;
  repo: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 10_000 ? "compact" : "standard" }).format(value);
}

function RepoClubBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(180deg,rgba(226,22,42,.18),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-[360px] bg-[linear-gradient(0deg,rgba(212,175,55,.10),transparent)]" />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { owner, repo } = await params;
  return {
    title: `${owner}/${repo} Club · FutClaw`,
    description: `Build a FutClaw squad from the contributors behind ${owner}/${repo}.`,
    robots: { index: false },
  };
}

function RepoErrorView({ owner, repo, error }: { owner: string; repo: string; error: RepoError }) {
  return (
    <main className="relative z-[2] mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-6 text-center">
      <div className="font-display text-[12px] font-bold tracking-[.3em] text-brand">REPO CLUB</div>
      <h1 className="font-display mt-3 text-[clamp(30px,6vw,48px)] font-black leading-[.95]">
        Club not found
      </h1>
      <p className="mt-3 text-[15.5px] leading-[1.5] text-ink-soft">
        {error.type === "invalid"
          ? "Use the format owner/repo, like vercel/next.js."
          : error.type === "notfound"
            ? `No public GitHub repo found for ${owner}/${repo}.`
            : error.message}
      </p>
      <Link
        href="/"
        className="font-display mt-7 inline-flex h-[46px] items-center rounded-xl bg-brand px-6 text-[16px] tracking-[.06em] text-[#04130a] transition hover:bg-brand-hi"
      >
        BUILD ANOTHER CLUB
      </Link>
    </main>
  );
}

export default async function RepoClubPage({ params }: { params: Promise<PageParams> }) {
  const { owner, repo } = await params;
  let data: Awaited<ReturnType<typeof buildRepoClub>>;

  try {
    data = await buildRepoClub(owner, repo);
  } catch (e) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-black text-[#ededed]">
        <RepoClubBackdrop />
        <RepoErrorView owner={owner} repo={repo} error={e as RepoError} />
      </div>
    );
  }

  const { summary, squad, clubCard } = data;
  const average = squad.length
    ? Math.round(squad.reduce((total, member) => total + member.card.overall, 0) / squad.length)
    : 0;
  const mvp = squad[0]?.card;

  after(async () => {
    await Promise.all([recordScout(), recordRepoClub(clubCard, "repo-page")]);
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-[#ededed]">
      <RepoClubBackdrop />
      <main className="relative z-[2] mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-[clamp(14px,3vw,28px)] py-[clamp(16px,3vw,28px)]">
        <section className="relative flex min-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[28px] border border-line bg-[#050505]/86 shadow-[0_40px_140px_-70px_rgba(0,0,0,.95),inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(16px,3vw,32px)] py-4">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[13px] font-semibold text-[#ededed] transition hover:border-white/30 hover:bg-white/[0.10]"
            >
              <ArrowLeft size={16} className="text-[#e2162a] transition-transform group-hover:-translate-x-0.5" />
              HOME
            </Link>
            <a
              href={summary.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[13px] font-medium text-ink-faint transition hover:border-white/25 hover:text-ink"
            >
              GitHub repo
              <ExternalLink className="size-3.5" />
            </a>
          </div>

          <div className="flex flex-col gap-7 px-[clamp(18px,4vw,52px)] py-[clamp(24px,5vw,46px)]">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">
                  <GitFork className="size-3.5" />
                  Repo Club · Starting XI
                </div>
                <h1 className="font-display mt-5 text-[clamp(42px,7vw,86px)] font-black leading-[0.92] tracking-tight">
                  {summary.fullName}
                </h1>
                {summary.description && (
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg">
                    {summary.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
                <div className="rounded-[10px] border border-line bg-white/[0.03] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Squad</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">{squad.length}</p>
                </div>
                <div className="rounded-[10px] border border-line bg-white/[0.03] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Avg OVR</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">{average || "--"}</p>
                </div>
                <div className="rounded-[10px] border border-line bg-white/[0.03] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Stars</p>
                  <p className="mt-2 flex items-center gap-1.5 text-2xl font-semibold tabular-nums">
                    <Star className="size-4 text-brand" />
                    {formatNumber(summary.stars)}
                  </p>
                </div>
                <div className="rounded-[10px] border border-line bg-white/[0.03] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Forks</p>
                  <p className="mt-2 flex items-center gap-1.5 text-2xl font-semibold tabular-nums">
                    <Users className="size-4 text-brand" />
                    {formatNumber(summary.forks)}
                  </p>
                </div>
              </div>
            </div>

            {mvp && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-brand/25 bg-brand/10 px-4 py-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand">Club MVP</p>
                  <p className="mt-1 text-base font-semibold">
                    @{mvp.login} · {mvp.overall} OVR {mvp.position}
                  </p>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                  4-3-3 contributor XI
                </p>
              </div>
            )}

            {squad.length > 0 ? (
              <RepoClubBoard summary={summary} squad={squad} />
            ) : (
              <div className="relative flex min-h-[460px] items-center justify-center rounded-[18px] border border-line bg-black/35 text-center text-ink-soft">
                Contributors found, but FutClaw could not scout their cards right now.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
