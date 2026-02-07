"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Bot, KeyRound, Rocket } from "lucide-react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { SimpleChart } from "../../../components/ui/simple-chart";
import { Skeleton } from "../../../components/ui/skeleton";
import { StatCard } from "../../../components/ui/stat-card";
import { api } from "../../../lib/api";
import { formatCurrency } from "../../../lib/format";

export default function DashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () =>
      api.dashboard.overview() as Promise<{
        metrics: {
          activeInstances: number;
          gpuHoursUsed: number;
          monthlySpend: number;
          referralEarnings: number;
        };
        charts: {
          usageOverTime: Array<{ date: string; value: number }>;
          spendOverTime: Array<{ date: string; value: number }>;
        };
        quickActions: Array<{ label: string; href: string }>;
      }>
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return <EmptyState title="Could not load dashboard" description="Refresh the page or try again in a moment." icon={Activity} />;
  }

  const { metrics, charts, quickActions } = overviewQuery.data;

  return (
    <div className="space-y-4">
      <Card className="relative flex flex-wrap items-center justify-between gap-4 border-brand-gray bg-white">
        <div className="spectrum-bar absolute inset-x-0 top-0 h-1" />
        <div>
          <p className="eyebrow text-brand-blue">What matters now</p>
          <h2 className="mt-2 text-xl text-ink-900">Infrastructure health is stable and deploy-ready.</h2>
          <p className="mt-1 text-sm text-ink-500">Review metrics below and launch new capacity when needed.</p>
        </div>
        <Link href="/marketplace">
          <Button variant="arrow">Launch new instance</Button>
        </Link>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Instances"
          value={String(metrics.activeInstances)}
          numericValue={metrics.activeInstances}
          formatter={(value) => Math.round(value).toString()}
          secondary="Includes provisioning and running"
        />
        <StatCard
          label="GPU Hours (MTD)"
          value={metrics.gpuHoursUsed.toFixed(2)}
          numericValue={metrics.gpuHoursUsed}
          formatter={(value) => value.toFixed(2)}
          secondary="Aggregated across all regions"
        />
        <StatCard
          label="Monthly Spend"
          value={formatCurrency(metrics.monthlySpend)}
          numericValue={metrics.monthlySpend}
          formatter={(value) => formatCurrency(value)}
          secondary="Usage and deployment holds included"
        />
        <StatCard
          label="Referral Earnings"
          value={formatCurrency(metrics.referralEarnings)}
          numericValue={metrics.referralEarnings}
          formatter={(value) => formatCurrency(value)}
          hint="Triggered on first deployment"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SimpleChart title="Usage over time" points={charts.usageOverTime} />
        <SimpleChart title="Spend over time" points={charts.spendOverTime} />
      </section>

      <section>
        <Card>
          <h3 className="text-base text-ink-900">Quick actions</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const icon =
                index === 0 ? Rocket : index === 1 ? Bot : index === 2 ? KeyRound : Activity;
              const Icon = icon;

              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group border border-brand-gray bg-white px-3.5 py-3 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-brand-charcoal"
                >
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center border border-brand-charcoal bg-brand-charcoal text-brand-lime">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium text-ink-800">{action.label}</p>
                  <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-ink-500">Open</p>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
