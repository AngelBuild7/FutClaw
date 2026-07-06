"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { pickName } from "@/lib/cardOverrides";
import { useClickOutside } from "@/hooks/useClickOutside";

interface Props {
  value: string;
  canonicalValue: string;
  onChange: (name: string) => void;
}

// The centered name row on the 540x820 PlayerCard.
const SLOT = { left: "16.7%", top: "51.9%", width: "66.6%", height: "10.4%" } as const;

export default function NamePicker({ value, canonicalValue, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
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
    onChange(pickName(draft, canonicalValue));
    setOpen(false);
  };

  const reset = () => {
    setDraft(canonicalValue);
    onChange(canonicalValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-20">
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-controls={open ? inputId : undefined}
        aria-label="Change card name"
        title="Change name"
        style={SLOT}
        className="group pointer-events-auto absolute flex items-center justify-center outline-none ring-brand/0 transition focus-visible:ring-2 focus-visible:ring-brand/70"
      >
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100 group-focus-visible:bg-black/35 group-focus-visible:opacity-100 group-aria-expanded:bg-black/35 group-aria-expanded:opacity-100">
          <Pencil className="h-[24%] w-[24%] text-white drop-shadow" />
        </span>
      </button>

      {open && (
        <div
          className="animate-pop pointer-events-auto absolute left-1/2 z-30 w-[min(260px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[14px] border border-line bg-panel/95 p-3 shadow-[0_18px_46px_-12px_rgba(0,0,0,.7)] backdrop-blur-[10px]"
          style={{ top: `calc(${SLOT.top} + ${SLOT.height} + 2.5%)` }}
        >
          <label htmlFor={inputId} className="text-[12px] font-semibold uppercase tracking-[.12em] text-ink-faint">
            Card name
          </label>
          <div className="mt-2 flex gap-2">
            <input
              ref={inputRef}
              id={inputId}
              value={draft}
              maxLength={24}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setOpen(false);
              }}
              className="h-10 min-w-0 flex-1 rounded-[9px] border border-line bg-bg/60 px-3 text-[15px] font-bold text-white outline-none transition focus:border-brand/70"
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
              Reset to {canonicalValue}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
