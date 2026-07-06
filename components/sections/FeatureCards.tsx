"use client";

import { motion } from "framer-motion";
import { Activity, IdCard, Share2, SlidersHorizontal } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  {
    icon: Activity,
    title: "Live from the source",
    description:
      "Commits, PRs, issues, reviews and stars pulled straight from the GitHub API. No stale snapshots, no manual sync.",
    kicker: "01",
  },
  {
    icon: IdCard,
    title: "Cards that look like FIFA",
    description:
      "An Ultimate-Team-style card: overall rating, position, six player traits, club and nation badges. Export as PNG in one click.",
    kicker: "02",
  },
  {
    icon: Share2,
    title: "Share anywhere",
    description:
      "X, LinkedIn, Discord, README, portfolio. The card URL renders an OG preview anywhere it lands.",
    kicker: "03",
  },
  {
    icon: SlidersHorizontal,
    title: "Made yours by URL params",
    description:
      "Send a link with ?theme=gold&show=stats and the card rebuilds itself. No login, no settings page, just URL.",
    kicker: "04",
  },
];

export function FeatureCards() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
      {FEATURES.map((feature, i) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: easeOut }}
            className="group flex flex-col gap-4 bg-bg p-8 transition-colors hover:bg-surface lg:p-10"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-dim transition-colors group-hover:text-ink">
                <Icon className="size-5" />
              </div>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
                {feature.kicker}
              </span>
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-ink">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-ink-dim">
              {feature.description}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
