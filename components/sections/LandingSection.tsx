"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const easeOut = [0.16, 1, 0.3, 1] as const;

interface Props {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
}

export function LandingSection({
  eyebrow,
  title,
  description,
  children,
  id,
  className = "",
}: Props) {
  return (
    <section
      id={id}
      className={"mx-auto max-w-6xl px-4 py-16 lg:px-10 lg:py-24 " + className}
    >
      {(eyebrow || title || description) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.4, ease: easeOut }}
          className="mb-10 lg:mb-16 max-w-2xl"
        >
          {eyebrow && (
            <p className="mb-4 text-eyebrow text-ink-soft">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="text-h2 text-ink">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-6 max-w-xl text-body-lg text-ink-dim">
              {description}
            </p>
          )}
        </motion.div>
      )}
      {children}
    </section>
  );
}
