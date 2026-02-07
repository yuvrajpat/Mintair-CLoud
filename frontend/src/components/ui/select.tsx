import clsx from "clsx";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "h-10 w-full rounded-none border border-brand-gray bg-brand-white px-3.5 text-sm text-ink-900",
        "transition-all duration-150 focus:border-brand-blue focus:bg-brand-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
