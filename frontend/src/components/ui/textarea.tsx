import clsx from "clsx";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-none border border-brand-gray bg-white px-3.5 py-2.5 text-sm text-brand-charcoal",
        "placeholder:text-ink-400 transition-all duration-150 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
        className
      )}
      {...props}
    />
  );
}
