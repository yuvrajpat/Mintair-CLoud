import { BillingType, InstanceStatus } from "@prisma/client";
import { startOfDay, subDays } from "date-fns";
import { prisma } from "../lib/prisma";

export async function getDashboardOverview(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeInstances, usageMonth, spendMonth, referralRewards, usageRows, spendRows] = await Promise.all([
    prisma.instance.count({
      where: {
        userId,
        status: { in: [InstanceStatus.RUNNING, InstanceStatus.PROVISIONING, InstanceStatus.RESTARTING] }
      }
    }),
    prisma.usageRecord.aggregate({
      where: { userId, metricType: "GPU_HOURS", recordedAt: { gte: startOfMonth } },
      _sum: { quantity: true }
    }),
    prisma.billingRecord.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        type: BillingType.DEBIT
      },
      _sum: { amount: true }
    }),
    prisma.billingRecord.aggregate({
      where: {
        userId,
        type: BillingType.REFERRAL_REWARD
      },
      _sum: { amount: true }
    }),
    prisma.usageRecord.findMany({
      where: {
        userId,
        recordedAt: { gte: startOfDay(subDays(now, 6)) }
      },
      select: {
        quantity: true,
        recordedAt: true
      },
      orderBy: { recordedAt: "asc" }
    }),
    prisma.billingRecord.findMany({
      where: {
        userId,
        createdAt: { gte: startOfDay(subDays(now, 6)) }
      },
      select: {
        amount: true,
        type: true,
        createdAt: true
      },
      orderBy: { createdAt: "asc" }
    })
  ]);

  const usageSeriesMap = new Map<string, number>();
  for (let i = 0; i < 7; i += 1) {
    const date = startOfDay(subDays(now, 6 - i));
    usageSeriesMap.set(date.toISOString().slice(0, 10), 0);
  }

  for (const row of usageRows) {
    const key = row.recordedAt.toISOString().slice(0, 10);
    if (usageSeriesMap.has(key)) {
      usageSeriesMap.set(key, Number((usageSeriesMap.get(key)! + Number(row.quantity)).toFixed(2)));
    }
  }

  const spendSeriesMap = new Map<string, number>();
  for (let i = 0; i < 7; i += 1) {
    const date = startOfDay(subDays(now, 6 - i));
    spendSeriesMap.set(date.toISOString().slice(0, 10), 0);
  }

  for (const row of spendRows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (spendSeriesMap.has(key) && row.type === BillingType.DEBIT) {
      spendSeriesMap.set(key, Number((spendSeriesMap.get(key)! + Math.abs(Number(row.amount))).toFixed(2)));
    }
  }

  return {
    metrics: {
      activeInstances,
      gpuHoursUsed: Number(usageMonth._sum.quantity ?? 0),
      monthlySpend: Number(Math.abs(Number(spendMonth._sum.amount ?? 0)).toFixed(2)),
      referralEarnings: Number(referralRewards._sum.amount ?? 0)
    },
    charts: {
      usageOverTime: [...usageSeriesMap.entries()].map(([date, value]) => ({ date, value })),
      spendOverTime: [...spendSeriesMap.entries()].map(([date, value]) => ({ date, value }))
    },
    quickActions: [
      { label: "Launch instance", href: "/marketplace" },
      { label: "Browse marketplace", href: "/marketplace" },
      { label: "Add SSH key", href: "/ssh-keys" },
      { label: "Get quotation", href: "/quotations" }
    ]
  };
}
