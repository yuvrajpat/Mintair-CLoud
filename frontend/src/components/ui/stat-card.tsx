"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "./card";
import { useTheme } from "../theme-provider";
import { GlowingEffect } from "./glowing-effect";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  secondary?: string;
  numericValue?: number;
  formatter?: (value: number) => string;
};

function useAnimatedValue(target?: number, duration = 460): number | null {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === undefined) {
      return;
    }

    let animationFrame = 0;
    const start = performance.now();

    const tick = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [duration, target]);

  return target === undefined ? null : value;
}

export function StatCard({ label, value, hint, secondary, numericValue, formatter }: StatCardProps) {
  const { resolvedTheme } = useTheme();
  const animatedValue = useAnimatedValue(numericValue);

  const displayValue = useMemo(() => {
    if (animatedValue === null || numericValue === undefined) {
      return value;
    }

    if (formatter) {
      return formatter(animatedValue);
    }

    return animatedValue.toLocaleString(undefined, {
      maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2
    });
  }, [animatedValue, formatter, numericValue, value]);

  return (
    <Card className="group metric-enter relative overflow-hidden p-5">
      {resolvedTheme === "dark" ? (
        <GlowingEffect spread={26} glow={false} disabled={false} proximity={54} inactiveZone={0.2} borderWidth={1.4} />
      ) : null}
      <div className="spectrum-bar absolute inset-x-0 top-0 h-1" />
      <p className="eyebrow text-ink-500">{label}</p>
      <p className="mt-3 text-[1.75rem] leading-none text-ink-900 md:text-[1.95rem]">{displayValue}</p>
      <div className="mt-3 min-h-[1.5rem]">
        {secondary ? (
          <p className="translate-y-1 text-xs text-ink-400 opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
            {secondary}
          </p>
        ) : hint ? (
          <p className="text-xs text-brand-blue">{hint}</p>
        ) : null}
      </div>
    </Card>
  );
}
