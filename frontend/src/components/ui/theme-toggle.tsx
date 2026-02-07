"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme-provider";

type ThemeToggleProps = {
  compact?: boolean;
  className?: string;
};

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={clsx(
        "inline-flex items-center justify-center gap-1 border border-brand-gray bg-brand-white text-ink-700 transition-colors duration-150 hover:border-brand-blue hover:text-brand-blue",
        compact ? "h-9 w-9" : "h-10 px-3 text-xs font-mono uppercase tracking-[0.08em]",
        className
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact ? <span>{isDark ? "Light" : "Dark"}</span> : null}
    </button>
  );
}
