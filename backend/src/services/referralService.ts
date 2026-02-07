import { BillingType, Prisma, ReferralStatus } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

export async function getReferralDashboard(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true }
  });

  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referred: {
        select: { email: true, fullName: true, createdAt: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const rewardRecords = await prisma.billingRecord.findMany({
    where: {
      userId,
      type: BillingType.REFERRAL_REWARD
    }
  });

  const totalEarnings = rewardRecords.reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    referralCode: user?.referralCode ?? "",
    referralLink: `${env.APP_BASE_URL}/signup?ref=${user?.referralCode ?? ""}`,
    stats: {
      totalReferrals: referrals.length,
      pending: referrals.filter((entry) => entry.status === ReferralStatus.PENDING).length,
      rewarded: referrals.filter((entry) => entry.status === ReferralStatus.REWARDED).length,
      totalEarnings: Number(totalEarnings.toFixed(2))
    },
    referrals: referrals.map((entry) => ({
      id: entry.id,
      status: entry.status,
      rewardAmount: Number(entry.rewardAmount),
      rewardTriggeredAt: entry.rewardTriggeredAt,
      createdAt: entry.createdAt,
      referredUser: entry.referred
    }))
  };
}

export async function rewardReferralForFirstDeployment(userId: string): Promise<void> {
  const referral = await prisma.referral.findFirst({
    where: {
      referredId: userId,
      status: ReferralStatus.PENDING
    }
  });

  if (!referral) {
    return;
  }

  const referrer = await prisma.user.findUnique({
    where: { id: referral.referrerId },
    select: { creditBalance: true }
  });

  const newBalance = Number(referrer?.creditBalance ?? 0) + env.REFERRAL_REWARD_USD;

  await prisma.$transaction(async (tx) => {
    await tx.referral.update({
      where: { id: referral.id },
      data: {
        status: ReferralStatus.REWARDED,
        rewardTriggeredAt: new Date(),
        rewardAmount: new Prisma.Decimal(env.REFERRAL_REWARD_USD.toFixed(2))
      }
    });

    await tx.billingRecord.create({
      data: {
        userId: referral.referrerId,
        type: BillingType.REFERRAL_REWARD,
        description: `Referral reward for code ${referral.code}`,
        amount: new Prisma.Decimal(env.REFERRAL_REWARD_USD.toFixed(2)),
        balanceAfter: new Prisma.Decimal(newBalance.toFixed(2))
      }
    });

    await tx.user.update({
      where: { id: referral.referrerId },
      data: {
        creditBalance: new Prisma.Decimal(newBalance.toFixed(2))
      }
    });
  });
}
