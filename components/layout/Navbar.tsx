"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINKS = [
  { label: "Scout", href: "/" },
  { label: "Community", href: "/community" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {/* Desktop navbar */}
      <nav className="fixed left-0 right-0 top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink"
          >
            <Image src="/mascot.svg" alt="" width={32} height={32} className="size-8 object-contain" />
            <span>FutClaw</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={
                  pathname === l.href
                    ? "text-sm font-medium text-ink"
                    : "text-sm font-medium text-ink-dim transition-colors hover:text-ink"
                }
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Hamburger button */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={open}
              className="relative flex size-10 items-center justify-center rounded-md border border-line bg-bg text-ink-dim transition hover:text-ink md:hidden"
            >
              <span className="flex flex-col items-center justify-center gap-[5px]">
                <motion.span
                  animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="block h-[1.5px] w-4 bg-current"
                />
                <motion.span
                  animate={open ? { opacity: 0 } : { opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="block h-[1.5px] w-4 bg-current"
                />
                <motion.span
                  animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="block h-[1.5px] w-4 bg-current"
                />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm md:hidden"
          >
            {/* Links centered */}
            <nav className="flex flex-col items-center gap-8">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{
                    delay: 0.05 + i * 0.05,
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link
                    href={l.href}
                    onClick={close}
                    className="text-2xl font-medium text-ink-dim transition-colors hover:text-ink"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
