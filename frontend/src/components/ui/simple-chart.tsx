"use client";

import { useMemo, useState } from "react";
import { useTheme } from "../theme-provider";
import { Card } from "./card";

type Point = { date: string; value: number };

function buildPath(points: Array<{ x: number; y: number }>): string {
  if (!points.length) {
    return "";
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
}

export function SimpleChart({ title, points }: { title: string; points: Point[] }) {
  const width = 680;
  const height = 240;
  const paddingX = 28;
  const paddingY = 24;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartId = useMemo(() => `chart-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, [title]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const axisColor = isDark ? "rgb(70, 79, 96)" : "rgb(218, 218, 218)";
  const strokeColor = isDark ? "rgba(96, 165, 250, 0.95)" : "rgba(37, 99, 235, 0.95)";
  const gradientStart = isDark ? "rgba(96, 165, 250, 0.18)" : "rgba(37, 99, 235, 0.24)";
  const gradientEnd = isDark ? "rgba(34, 211, 238, 0.02)" : "rgba(6, 182, 212, 0.01)";
  const dotColor = isDark ? "rgba(34, 211, 238, 0.85)" : "rgba(6, 182, 212, 0.78)";
  const dotActiveColor = isDark ? "rgba(96, 165, 250, 1)" : "rgba(37, 99, 235, 1)";

  const normalized = useMemo(() => {
    const values = points.map((point) => point.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    return points.map((point, index) => {
      const x = paddingX + (index / Math.max(points.length - 1, 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((point.value - min) / range) * (height - paddingY * 2);
      return { ...point, x, y };
    });
  }, [points]);

  const linePath = buildPath(normalized);
  const areaPath = linePath
    ? `${linePath} L${normalized[normalized.length - 1]?.x ?? width - paddingX},${height - paddingY} L${normalized[0]?.x ?? paddingX},${height - paddingY} Z`
    : "";

  const activePoint = activeIndex === null ? null : normalized[activeIndex] ?? null;

  return (
    <Card className="overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base text-ink-900">{title}</h3>
        <span className="border border-brand-gray bg-brand-white px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-500">
          Last 7 days
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
          <defs>
            <linearGradient id={`${chartId}-area-gradient`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>

          <g>
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke={axisColor} />
            <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke={axisColor} />
          </g>

          {areaPath ? <path d={areaPath} fill={`url(#${chartId}-area-gradient)`} className="origin-left animate-[tabFade_420ms_ease-out]" /> : null}

          <g className="origin-left animate-[tabFade_420ms_ease-out]">
            {linePath ? (
              <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2.25" strokeLinecap="square" />
            ) : null}
          </g>

          {normalized.map((point, index) => (
            <g
              key={point.date}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={activeIndex === index ? 4 : 3}
                fill={activeIndex === index ? dotActiveColor : dotColor}
                className="transition-all duration-150"
              />
              <circle cx={point.x} cy={point.y} r={12} fill="transparent" />
            </g>
          ))}
        </svg>

        {activePoint ? (
          <div
            className="pointer-events-none absolute z-10 border border-brand-gray bg-brand-white px-3 py-2 text-xs transition-all duration-150"
            style={{
              left: `calc(${(activePoint.x / width) * 100}% - 48px)`,
              top: `calc(${(activePoint.y / height) * 100}% - 54px)`
            }}
          >
            <p className="font-semibold text-ink-800">{activePoint.value.toFixed(2)}</p>
            <p className="text-ink-500">{activePoint.date}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
