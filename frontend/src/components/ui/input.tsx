import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "h-11 w-full rounded-none border border-brand-gray bg-white px-3.5 text-sm text-brand-charcoal sm:h-10",
        "placeholder:text-ink-400 transition-all duration-150 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
        className
      )}
      {...props}
    />
  );
}
