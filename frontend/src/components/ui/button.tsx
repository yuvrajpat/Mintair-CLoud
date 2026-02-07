"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "arrow";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingLabel?: string;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  loadingLabel = "Working",
  children,
  disabled,
  ...props
}: Props) {
  const isArrowVariant = variant === "arrow";

  return (
    <button
      className={clsx(
        "relative inline-flex items-center justify-center overflow-hidden rounded-none border font-medium tracking-tight transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        "active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60",
        isArrowVariant && "group border-0 bg-transparent p-0 text-ink-900",
        size === "sm" && "h-10 px-3.5 text-xs sm:h-9",
        size === "md" && "h-11 px-4 text-sm sm:h-10",
        size === "lg" && "h-12 px-5 text-sm sm:h-11",
        variant === "primary" &&
          "border-brand-charcoal bg-brand-charcoal text-white hover:bg-[#252933] active:bg-[#252933] disabled:border-ink-400 disabled:bg-ink-400",
        variant === "secondary" &&
          "border-brand-gray bg-brand-white font-mono text-[13px] uppercase tracking-[0.08em] text-ink-900 hover:border-brand-blue hover:bg-ink-100",
        variant === "danger" && "border-rose-600 bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-700",
        variant === "ghost" && "border-transparent bg-transparent text-ink-700 hover:border-brand-gray hover:bg-ink-100/70 hover:text-ink-900",
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      <span className={clsx("inline-flex items-center gap-2 transition-opacity duration-150", loading && "opacity-0")}>
        {isArrowVariant ? (
          <>
            <span className="inline-flex h-9 w-9 items-center justify-center bg-brand-charcoal text-brand-lime transition-transform duration-200 ease-out group-hover:translate-x-1">
              →
            </span>
            <span className="font-mono text-[13px] uppercase tracking-[0.08em]">{children}</span>
          </>
        ) : (
          children
        )}
      </span>

      <span
        className={clsx(
          "pointer-events-none absolute inset-0 inline-flex items-center justify-center gap-2 text-sm transition-opacity duration-150",
          loading ? "opacity-100" : "opacity-0"
        )}
      >
        <span
          className={clsx(
            "h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent",
            variant === "secondary" || variant === "ghost" || variant === "arrow" ? "text-ink-700" : "text-white"
          )}
        />
        <span className="text-xs font-medium tracking-wide">{loadingLabel}</span>
      </span>
    </button>
  );
}
