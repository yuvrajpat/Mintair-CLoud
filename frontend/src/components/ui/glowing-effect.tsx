"use client";

import { memo, useCallback, useEffect, useRef, type CSSProperties } from "react";
import { cn } from "../../lib/utils";

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

function animateAngle(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (value: number) => void,
  done: () => void
) {
  const startedAt = performance.now();
  let raf = 0;

  const tick = (now: number) => {
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / durationMs);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = from + (to - from) * eased;
    onUpdate(value);

    if (progress < 1) {
      raf = window.requestAnimationFrame(tick);
      return;
    }

    done();
  };

  raf = window.requestAnimationFrame(tick);
  return () => window.cancelAnimationFrame(raf);
}

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.65,
    proximity = 0,
    spread = 20,
    variant = "default",
    glow = false,
    className,
    movementDuration = 0.22,
    borderWidth = 1,
    disabled = true
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);
    const stopAngleAnimationRef = useRef<(() => void) | null>(null);

    const handleMove = useCallback(
      (event?: PointerEvent | MouseEvent | { x: number; y: number }) => {
        if (!containerRef.current) {
          return;
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) {
            return;
          }

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = event?.x ?? lastPosition.current.x;
          const mouseY = event?.y ?? lastPosition.current.y;

          if (event) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const center = [left + width * 0.5, top + height * 0.5];
          const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          if (distanceFromCenter < inactiveRadius) {
            element.style.setProperty("--active", "0");
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty("--active", isActive ? "1" : "0");
          if (!isActive) {
            return;
          }

          const currentAngle = parseFloat(element.style.getPropertyValue("--start")) || 0;
          const nextAngle = (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
          const angleDiff = ((nextAngle - currentAngle + 180) % 360) - 180;
          const targetAngle = currentAngle + angleDiff;

          stopAngleAnimationRef.current?.();
          stopAngleAnimationRef.current = animateAngle(
            currentAngle,
            targetAngle,
            movementDuration * 1000,
            (value) => element.style.setProperty("--start", String(value)),
            () => {
              stopAngleAnimationRef.current = null;
            }
          );
        });
      },
      [inactiveZone, movementDuration, proximity]
    );

    useEffect(() => {
      if (disabled) {
        return;
      }

      const onScroll = () => handleMove();
      const onPointerMove = (event: PointerEvent) => handleMove(event);

      window.addEventListener("scroll", onScroll, { passive: true });
      document.body.addEventListener("pointermove", onPointerMove, { passive: true });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        stopAngleAnimationRef.current?.();
        window.removeEventListener("scroll", onScroll);
        document.body.removeEventListener("pointermove", onPointerMove);
      };
    }, [disabled, handleMove]);

    return (
      <>
        <div
          className={cn(
            "pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity",
            glow && "opacity-100",
            variant === "white" && "border-white",
            disabled && "!block"
          )}
        />
        <div
          ref={containerRef}
          style={
            {
              "--blur": `${blur}px`,
              "--spread": spread,
              "--start": "0",
              "--active": "0",
              "--glowingeffect-border-width": `${borderWidth}px`,
              "--repeating-conic-gradient-times": "5",
              "--gradient":
                variant === "white"
                  ? `repeating-conic-gradient(
                      from 236.84deg at 50% 50%,
                      rgb(var(--color-brand-charcoal)),
                      rgb(var(--color-brand-charcoal)) calc(25% / var(--repeating-conic-gradient-times))
                    )`
                  : `radial-gradient(circle, rgba(221,123,187,0.6) 10%, transparent 20%),
                    radial-gradient(circle at 40% 40%, rgba(215,159,30,0.55) 5%, transparent 15%),
                    radial-gradient(circle at 60% 60%, rgba(90,146,44,0.55) 10%, transparent 20%),
                    radial-gradient(circle at 40% 60%, rgba(76,120,148,0.6) 10%, transparent 20%),
                    repeating-conic-gradient(
                      from 236.84deg at 50% 50%,
                      #dd7bbb 0%,
                      #d79f1e calc(25% / var(--repeating-conic-gradient-times)),
                      #5a922c calc(50% / var(--repeating-conic-gradient-times)),
                      #4c7894 calc(75% / var(--repeating-conic-gradient-times)),
                      #dd7bbb calc(100% / var(--repeating-conic-gradient-times))
                    )`
            } as CSSProperties
          }
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
            glow && "opacity-100",
            blur > 0 && "blur-[var(--blur)]",
            className,
            disabled && "!hidden"
          )}
        >
          <div
            className={cn(
              "glow rounded-[inherit]",
              'after:content-[""] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))] after:rounded-[inherit]',
              "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
              "after:[background:var(--gradient)] after:[background-attachment:fixed]",
              "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
              "after:[mask-clip:padding-box,border-box]",
              "after:[mask-composite:intersect]",
              "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
            )}
          />
        </div>
      </>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
