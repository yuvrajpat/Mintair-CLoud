"use client";

import { Box, Lock, Search, Settings, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { GlowingEffect } from "./glowing-effect";

export function GlowingEffectDemo() {
  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 xl:max-h-[34rem] xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<Box className="h-4 w-4" />}
        title="Do things the right way"
        description="Run deployments with stricter defaults and lower risk."
      />
      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<Settings className="h-4 w-4" />}
        title="Operational controls that stay out of your way"
        description="Everything critical is one click away, without visual clutter."
      />
      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<Lock className="h-4 w-4" />}
        title="Security-first controls"
        description="Sessions, keys, billing and access controls in one surface."
      />
      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<Sparkles className="h-4 w-4" />}
        title="Premium interaction layer"
        description="Subtle glow responds to pointer direction and intent."
      />
      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        icon={<Search className="h-4 w-4" />}
        title="Designed to scale"
        description="Visual language stays consistent across every module."
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

function GridItem({ area, icon, title, description }: GridItemProps) {
  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <div className="relative h-full rounded-none border border-brand-gray p-2 md:p-3">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-none border border-brand-gray bg-brand-white p-6 shadow-none">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-none border border-brand-gray bg-ink-100 p-2 text-ink-900">{icon}</div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] text-ink-900 md:text-2xl md:leading-[1.875rem]">
                {title}
              </h3>
              <p className="text-sm leading-[1.125rem] text-ink-600 md:text-base md:leading-[1.375rem]">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
