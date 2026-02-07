import clsx from "clsx";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warn" | "danger" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors",
        tone === "neutral" && "border-ink-200 bg-ink-100 text-ink-700",
        tone === "success" && "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
        tone === "warn" && "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
        tone === "danger" && "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5",
          tone === "neutral" && "bg-ink-500",
          tone === "success" && "bg-emerald-500",
          tone === "warn" && "bg-amber-500",
          tone === "danger" && "bg-rose-500"
        )}
      />
      {label}
    </span>
  );
}
