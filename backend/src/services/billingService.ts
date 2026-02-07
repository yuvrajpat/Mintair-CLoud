import { BillingType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";

function toAmount(value: Prisma.Decimal | null | undefined): number {
  return Number(value ?? 0);
}

export async function getBillingOverview(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [user, monthlyDebits, paymentMethods, invoices, records] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true }
    }),
    prisma.billingRecord.aggregate({
      where: { userId, type: BillingType.DEBIT, createdAt: { gte: startOfMonth } },
      _sum: { amount: true }
    }),
    prisma.paymentMethod.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    prisma.invoice.findMany({ where: { userId }, orderBy: { issuedAt: "desc" }, take: 12 }),
    prisma.billingRecord.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 })
  ]);

  return {
    balance: Number(toAmount(user?.creditBalance).toFixed(2)),
    monthlySpend: Number(Math.abs(toAmount(monthlyDebits._sum.amount)).toFixed(2)),
    paymentMethods,
    invoices: invoices.map((invoice) => ({
      ...invoice,
      totalAmount: Number(invoice.totalAmount)
    })),
    records: records.map((record) => ({
      ...record,
      amount: Number(record.amount),
      balanceAfter: Number(record.balanceAfter ?? 0)
    }))
  };
}

export async function addPaymentMethod(
  userId: string,
  input: {
    type: "CARD" | "BANK";
    provider: string;
    brand: string;
    number: string;
    expMonth: number;
    expYear: number;
    isDefault?: boolean;
  }
) {
  const number = input.number.replace(/\s+/g, "");
  if (!/^\d{12,19}$/.test(number)) {
    throw new AppError("Payment method number is invalid.", 400);
  }

  if (input.expMonth < 1 || input.expMonth > 12) {
    throw new AppError("Expiry month must be between 1 and 12.", 400);
  }

  if (input.expYear < new Date().getFullYear()) {
    throw new AppError("Payment method appears to be expired.", 400);
  }

  if (input.isDefault) {
    await prisma.paymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });
  }

  const created = await prisma.paymentMethod.create({
    data: {
      userId,
      type: input.type,
      provider: input.provider,
      brand: input.brand,
      last4: number.slice(-4),
      expMonth: input.expMonth,
      expYear: input.expYear,
      isDefault: input.isDefault ?? false
    }
  });

  return created;
}

export async function getUsageBreakdown(userId: string, groupBy: "instance" | "gpu" | "region") {
  const rows = await prisma.usageRecord.findMany({
    where: { userId },
    include: {
      instance: { select: { id: true, name: true } },
      marketplaceItem: { select: { gpuType: true } }
    }
  });

  const accumulator = new Map<string, number>();

  for (const row of rows) {
    const key =
      groupBy === "instance"
        ? row.instance?.name ?? "Unassigned"
        : groupBy === "gpu"
          ? row.marketplaceItem?.gpuType ?? "Unknown GPU"
          : row.region;

    accumulator.set(key, Number(((accumulator.get(key) ?? 0) + Number(row.quantity)).toFixed(2)));
  }

  return [...accumulator.entries()].map(([label, quantity]) => ({ label, quantity }));
}
