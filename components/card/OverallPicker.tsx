"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { pickOverall } from "@/lib/cardOverrides";
import { useClickOutside } from "@/hooks/useClickOutside";

interface Props {
  value: number;
  canonicalValue: number;
  onChange: (overall: number) => void;
}

// The overall slot on the 540x820 PlayerCard. Kept aligned with PlayerCard.tsx.
const SLOT = { left: "16.3%", top: "9.76%", width: "20%", height: "13.5%" } as const;

export default function OverallPicker({ value, canonicalValue, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useClickOutside(rootRef, open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  const commit = () => {
    onChange(pickOverall(draft, canonicalValue));
    setOpen(false);
  };

  const reset = () => {
    setDraft(String(canonicalValue));
    onChange(canonicalValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-20">
      <button
        type="button"
        onClick={() => {
          setDraft(String(value));
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-controls={open ? inputId : undefined}
        aria-label="Change card rating"
        title="Change rating"
        style={SLOT}
        className="group pointer-events-auto absolute flex items-center justify-center outline-none ring-brand/0 transition focus-visible:ring-2 focus-visible:ring-brand/70"
      >
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100 group-focus-visible:bg-black/35 group-focus-visible:opacity-100 group-aria-expanded:bg-black/35 group-aria-expanded:opacity-100">
          <Pencil className="h-[28%] w-[28%] text-white drop-shadow" />
        </span>
      </button>

      {open && (
        <div
          className="animate-pop pointer-events-auto absolute z-30 w-[190px] overflow-hidden rounded-[14px] border border-line bg-panel/95 p-3 shadow-[0_18px_46px_-12px_rgba(0,0,0,.7)] backdrop-blur-[10px]"
          style={{ left: SLOT.left, top: `calc(${SLOT.top} + ${SLOT.height} + 2.5%)` }}
        >
          <label htmlFor={inputId} className="text-[12px] font-semibold uppercase tracking-[.12em] text-ink-faint">
            Card rating
          </label>
          <div className="mt-2 flex gap-2">
            <input
              ref={inputRef}
              id={inputId}
              inputMode="numeric"
              pattern="[0-9]*"
              min={1}
              max={99}
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 2))}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setOpen(false);
              }}
              className="h-10 min-w-0 flex-1 rounded-[9px] border border-line bg-bg/60 px-3 text-[18px] font-bold text-white outline-none transition focus:border-brand/70"
            />
            <button
              type="button"
              onClick={commit}
              className="rounded-[9px] bg-brand px-3 text-[13px] font-bold text-black transition hover:bg-brand-hi"
            >
              Set
            </button>
          </div>
          {value !== canonicalValue && (
            <button
              type="button"
              onClick={reset}
              className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-faint transition hover:text-ink"
            >
              <RotateCcw size={12} />
              Reset to scouted {canonicalValue}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
