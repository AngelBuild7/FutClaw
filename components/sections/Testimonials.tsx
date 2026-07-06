"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const TESTIMONIALS = [
  {
    quote:
      "Put my FutClaw card in my GitHub bio. Three recruiters asked me about it. Three.",
    name: "Lucas Ramírez",
    role: "Backend · Buenos Aires",
    handle: "lucasr",
  },
  {
    quote:
      "Finally something that doesn't reduce me to a contribution graph. The traits are weirdly accurate.",
    name: "Anya Volkov",
    role: "Platform eng · Berlin",
    handle: "anyavol",
  },
  {
    quote:
      "Shared my card on X. 800 clicks on the link in a weekend. The OG preview is the whole pitch.",
    name: "Michael Chen",
    role: "Indie hacker · SF",
    handle: "miketc",
  },
];

export function Testimonials() {
  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      {TESTIMONIALS.map((t, i) => (
        <motion.figure
          key={t.handle}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.4, delay: i * 0.06, ease: easeOut }}
          className="flex flex-col gap-6 rounded-xl border border-line bg-surface/40 p-6 transition-colors hover:bg-surface lg:p-8"
        >
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                className="size-3.5 fill-amber text-amber"
                aria-hidden
              />
            ))}
          </div>
          <blockquote className="flex-1 text-base leading-relaxed text-ink lg:text-lg">
            {t.quote}
          </blockquote>
          <figcaption className="flex items-center gap-3 border-t border-line pt-4">
            <img
              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${t.handle}`}
              alt=""
              aria-hidden
              className="size-8 rounded-full border border-line bg-surface-2"
            />
            <div>
              <p className="text-sm font-medium text-ink">{t.name}</p>
              <p className="text-xs text-ink-soft">{t.role}</p>
            </div>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}