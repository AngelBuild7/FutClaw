"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const FAQS = [
  {
    question: "How is the rating calculated?",
    answer:
      "The score blends commits, PRs and issues (weighted by recency), reputation (stars and forks), and consistency (contribution streaks). You can see the exact weights in the scoring section under your card.",
  },
  {
    question: "Is it free?",
    answer:
      "Yes. Generating, exporting and sharing your card is free. Premium themes and team albums come later — your card will still be free.",
  },
  {
    question: "Can I customize my card?",
    answer:
      "Yes, through URL params. Try ?theme=gold, ?show=stats,bio, or ?hide=club in your card URL and the card rebuilds itself. We'll publish the full list soon.",
  },
  {
    question: "Will it read my private repos?",
    answer:
      "No. FutClaw only reads public GitHub data through the public API. You can also pin specific repos in the player settings later.",
  },
  {
    question: "Which platforms are supported?",
    answer:
      "GitHub profiles and public GitHub repositories today. Additional public developer sources can be added by the community.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      {/* sticky heading on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.4, ease: easeOut }}
        className="lg:sticky lg:top-32 lg:self-start"
      >
        <p className="mb-4 text-eyebrow text-ink-soft">
          Questions
        </p>
        <h2 className="text-h2 text-ink">
          The five people actually ask.
        </h2>
      </motion.div>

      <div className="border-t border-line">
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          const qId = `${baseId}-q-${i}`;
          const aId = `${baseId}-a-${i}`;
          return (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="border-b border-line"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={aId}
                id={qId}
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
              >
                <span
                  className={
                    "text-base font-medium transition-colors lg:text-lg " +
                    (isOpen ? "text-ink" : "text-ink-dim")
                  }
                >
                  {faq.question}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="shrink-0 text-ink-soft"
                  aria-hidden
                >
                  <ChevronDown className="size-5" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: easeOut }}
                    role="region"
                    aria-labelledby={qId}
                    id={aId}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 pr-12 text-sm leading-relaxed text-ink-dim lg:text-base">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
