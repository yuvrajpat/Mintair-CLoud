"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "mintair-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function isValidTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(resolvedTheme: ResolvedTheme): void {
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const nextTheme: Theme = isValidTheme(stored) ? stored : "system";
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      const nextResolved = resolveTheme(theme);
      setResolvedTheme(nextResolved);
      applyTheme(nextResolved);
    };

    syncTheme();
    localStorage.setItem(STORAGE_KEY, theme);

    if (theme !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => syncTheme();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme: () => {
        setTheme((current) => {
          const currentResolved = current === "system" ? resolveTheme("system") : current;
          return currentResolved === "dark" ? "light" : "dark";
        });
      }
    }),
    [resolvedTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
