import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemePrefs = {
  mode: ThemeMode;
};

const THEME_KEY = "cp_theme";

function readPrefs(): ThemePrefs {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return { mode: "system" };
    const parsed = JSON.parse(raw) as Partial<ThemePrefs> & { mode?: ThemeMode };
    return { mode: parsed.mode ?? "system" };
  } catch {
    return { mode: "system" };
  }
}

function writePrefs(next: ThemePrefs) {
  localStorage.setItem(THEME_KEY, JSON.stringify(next));
}

function applyMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && prefersDark);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.setAttribute("data-theme-mode", mode);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => readPrefs().mode);

  useEffect(() => {
    applyMode(mode);
    writePrefs({ mode });
  }, [mode]);

  return { mode, setMode };
}
