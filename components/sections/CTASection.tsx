"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;

export function CTASection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="relative overflow-hidden rounded-2xl border border-line bg-surface/40 px-8 py-16 text-center lg:px-16 lg:py-24"
    >
      {/* tiny status pill — only visual cue, no ping */}
      <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-1 text-eyebrow text-ink-dim">
        <span className="size-1.5 rounded-full bg-brand" />
        Free · no signup
      </span>

      <h2 className="mx-auto max-w-2xl text-h1 text-ink">
        Drop your username.
        <br />
        <span className="text-ink-dim">Get rated in three seconds.</span>
      </h2>

      <p className="mx-auto mt-6 max-w-md text-body-lg text-ink-soft">
        No account. No email. No credit card. Just your GitHub handle and a
        card you can share today.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href="#top"
          className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-mid active:scale-[0.98] sm:w-auto"
        >
          Rate my GitHub
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </a>
        <a
          href="#features"
          className="inline-flex h-12 w-full items-center justify-center rounded-md border border-line bg-bg px-6 text-sm font-medium text-ink-dim transition hover:border-line-hover hover:text-ink sm:w-auto"
        >
          See features
        </a>
      </div>
    </motion.div>
  );
}