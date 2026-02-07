import { LucideIcon, Sparkles } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = Sparkles
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="metric-enter border border-dashed border-ink-300 px-5 py-6 text-center">
      <div className="mx-auto inline-flex h-11 w-11 items-center justify-center border border-brand-charcoal bg-brand-charcoal text-brand-lime">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-lg text-ink-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{description}</p>
    </div>
  );
}
