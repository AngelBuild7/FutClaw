"use client";

import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Palette, RotateCcw, X } from "lucide-react";
import type { CardThemeOverride } from "@/lib/scoring/types";
import { CARD_THEME_OVERRIDES, pickAccent, pickTheme } from "@/lib/cardOverrides";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface CardCustomization {
  theme?: CardThemeOverride;
  accent?: string;
}

interface Props {
  value?: CardCustomization;
  onChange: (value: CardCustomization) => void;
}

const LABELS: Record<CardThemeOverride, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  toty: "TOTY",
  icon: "Icon",
  claw: "Claw",
  midnight: "Midnight",
};

const SWATCH: Record<CardThemeOverride, string> = {
  bronze: "#b8793f",
  silver: "#c6d0dc",
  gold: "#e7bd4f",
  toty: "#3b7aff",
  icon: "#f3d688",
  claw: "#ff2f45",
  midnight: "#111a33",
};

const DEFAULT_ACCENT = "#e2162a";

export default function CustomizationPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const accent = value?.accent ?? DEFAULT_ACCENT;

  useClickOutside(rootRef, open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const setTheme = (theme: CardThemeOverride) => {
    onChange({ ...value, theme: pickTheme(theme) });
  };

  const setAccent = (next: string) => {
    onChange({ ...value, accent: pickAccent(next) });
  };

  const clearAccent = () => {
    onChange({ ...value, accent: undefined });
  };

  const reset = () => {
    onChange({});
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative z-30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group inline-flex items-center gap-2 rounded-full border border-line bg-bg-deep/70 px-3 py-2 text-[12.5px] font-semibold text-ink-soft backdrop-blur-md transition hover:-translate-y-px hover:border-white/25 hover:bg-bg-deep hover:text-ink"
      >
        <Palette size={15} className="text-brand transition group-hover:rotate-[-8deg]" />
        Customize
      </button>

      {open && (
        <div className="animate-pop absolute left-1/2 top-[calc(100%+10px)] w-[min(320px,calc(100vw-32px))] -translate-x-1/2 rounded-[18px] border border-line bg-panel/95 p-4 shadow-[0_22px_60px_-18px_rgba(0,0,0,.85)] backdrop-blur-xl max-[520px]:left-auto max-[520px]:right-0 max-[520px]:translate-x-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[.16em] text-ink-faint">Mini customization</p>
              <h3 className="mt-1 text-[16px] font-bold text-ink">Card look</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close customization"
              className="rounded-full p-1.5 text-ink-faint transition hover:bg-white/10 hover:text-ink"
            >
              <X size={15} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {CARD_THEME_OVERRIDES.map((theme) => {
              const selected = value?.theme === theme;
              return (
                <button
                  type="button"
                  key={theme}
                  onClick={() => setTheme(theme)}
                  className={`rounded-xl border p-2 text-left transition hover:-translate-y-px ${
                    selected ? "border-brand bg-brand/12 text-white" : "border-line bg-white/[0.03] text-ink-dim hover:border-white/25 hover:text-white"
                  }`}
                >
                  <span
                    className="block h-7 rounded-lg shadow-[inset_0_0_0_1px_rgba(255,255,255,.18)]"
                    style={{ background: `linear-gradient(135deg, ${SWATCH[theme]}, #050505)` }}
                  />
                  <span className="mt-1.5 block truncate text-[11px] font-semibold">{LABELS[theme]}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-black/20 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[.14em] text-ink-faint">Accent</span>
              {value?.accent && (
                <button type="button" onClick={clearAccent} className="text-[12px] font-medium text-ink-faint transition hover:text-ink">
                  Clear
                </button>
              )}
            </div>
            <HexColorPicker color={accent} onChange={setAccent} className="!w-full" />
            <div className="mt-3 flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg border border-white/15" style={{ background: accent }} />
              <input
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-bg/60 px-3 font-mono text-[13px] text-ink outline-none transition focus:border-brand/70"
                aria-label="Accent hex color"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-faint transition hover:text-ink"
          >
            <RotateCcw size={12} />
            Reset to scouted look
          </button>
        </div>
      )}
    </div>
  );
}
