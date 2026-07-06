"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { SPRING_LAYOUT, SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/utils";
import { useFutClawTheme } from "@/lib/useFutClawTheme";

export function CommunityThemeToggle() {
  const { activeTheme, resolvedTheme, setTheme } = useFutClawTheme();
  const reduceMotion = useReducedMotion();
  const isLight = resolvedTheme === "light";

  return (
    <div
      className={cn(
        "flex h-11 items-center gap-1 rounded-full border p-1",
        isLight
          ? "border-[#00000015] bg-white text-[#4d4d4d]"
          : "border-[#ffffff17] bg-black text-[#a0a0a0]",
      )}
    >
      {[
        { id: "system" as const, label: "Use system theme", icon: Monitor },
        { id: "light" as const, label: "Use light theme", icon: Sun },
        { id: "dark" as const, label: "Use dark theme", icon: Moon },
      ].map((item) => (
        <motion.button
          key={item.id}
          type="button"
          onClick={() => setTheme(item.id)}
          aria-label={item.label}
          whileTap={reduceMotion ? undefined : { scale: 0.92 }}
          transition={SPRING_PRESS}
          className={cn(
            "relative flex size-9 items-center justify-center rounded-full transition-colors",
            activeTheme === item.id
              ? isLight
                ? "text-[#171717]"
                : "text-[#ededed]"
              : isLight
                ? "hover:bg-[#f2f2f2] hover:text-[#171717]"
                : "hover:bg-[#1a1a1a] hover:text-[#ededed]",
          )}
        >
          {activeTheme === item.id ? (
            <motion.span
              layoutId="futclaw-theme-toggle-active"
              className={cn(
                "absolute inset-0 rounded-full",
                isLight ? "bg-[#f2f2f2]" : "bg-[#1f1f1f]",
              )}
              transition={reduceMotion ? { duration: 0 } : SPRING_LAYOUT}
            />
          ) : null}
          <item.icon className="relative z-10 size-4" />
        </motion.button>
      ))}
    </div>
  );
}
