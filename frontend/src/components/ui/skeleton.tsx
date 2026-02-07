import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("skeleton-shimmer border border-ink-200 bg-ink-100/80", className)} {...props} />;
}
