"use client";

import { useEffect, useState } from "react";

export type FutClawThemeChoice = "system" | "light" | "dark";
export type FutClawResolvedTheme = "light" | "dark";

const STORAGE_KEY = "futclaw:theme";
const THEME_EVENT = "futclaw:theme-change";

function resolveTheme(theme: FutClawThemeChoice): FutClawResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

function applyTheme(theme: FutClawThemeChoice) {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function readStoredTheme(): FutClawThemeChoice {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "system" || stored === "light" || stored === "dark" ? stored : "dark";
}

export function setFutClawTheme(theme: FutClawThemeChoice) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function useFutClawTheme() {
  const [activeTheme, setActiveTheme] = useState<FutClawThemeChoice>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<FutClawResolvedTheme>("dark");

  useEffect(() => {
    const sync = () => {
      const theme = readStoredTheme();
      setActiveTheme(theme);
      applyTheme(theme);
      setResolvedTheme(resolveTheme(theme));
    };

    sync();

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onMediaChange = () => {
      if (readStoredTheme() === "system") sync();
    };

    media.addEventListener("change", onMediaChange);
    window.addEventListener(THEME_EVENT, sync);
    return () => {
      media.removeEventListener("change", onMediaChange);
      window.removeEventListener(THEME_EVENT, sync);
    };
  }, []);

  return {
    activeTheme,
    resolvedTheme,
    setTheme: setFutClawTheme,
  };
}
