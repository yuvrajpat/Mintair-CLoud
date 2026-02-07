"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "../../../components/ui/card";
import { CopyButton } from "../../../components/ui/copy-button";
import { EmptyState } from "../../../components/ui/empty-state";
import { StatCard } from "../../../components/ui/stat-card";
import { api } from "../../../lib/api";
import { formatCurrency, formatDate } from "../../../lib/format";

export default function ReferralsPage() {
  const referralQuery = useQuery({
    queryKey: ["referrals"],
    queryFn: () =>
      api.referrals.overview() as Promise<{
        referralCode: string;
        referralLink: string;
        stats: {
          totalReferrals: number;
          pending: number;
          rewarded: number;
          totalEarnings: number;
        };
        referrals: Array<{
          id: string;
          status: string;
          rewardAmount: number;
          rewardTriggeredAt: string | null;
          createdAt: string;
          referredUser: {
            email: string;
            fullName: string;
          };
        }>;
      }>
  });

  if (!referralQuery.data) {
    return <Card className="text-sm text-ink-500">Loading referrals...</Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-base font-semibold text-ink-900">Your referral link</h3>
        <p className="mt-2 break-all text-sm text-ink-600">{referralQuery.data.referralLink}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton value={referralQuery.data.referralLink} label="Copy link" />
          <CopyButton value={referralQuery.data.referralCode} label="Copy code" />
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total referrals" value={String(referralQuery.data.stats.totalReferrals)} />
        <StatCard label="Pending" value={String(referralQuery.data.stats.pending)} />
        <StatCard label="Rewarded" value={String(referralQuery.data.stats.rewarded)} />
        <StatCard label="Total earnings" value={formatCurrency(referralQuery.data.stats.totalEarnings)} />
      </section>

      <Card>
        <h3 className="text-base font-semibold text-ink-900">Referral activity</h3>
        {referralQuery.data.referrals.length ? (
          <div className="mt-3 space-y-2">
            {referralQuery.data.referrals.map((referral) => (
              <div key={referral.id} className="rounded-xl border border-ink-100 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink-800">{referral.referredUser.fullName}</p>
                    <p className="text-ink-500">{referral.referredUser.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink-800">{referral.status}</p>
                    <p className="text-xs text-ink-400">{formatCurrency(referral.rewardAmount)}</p>
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-400">
                  Joined {formatDate(referral.createdAt)}
                  {referral.rewardTriggeredAt ? ` • Rewarded ${formatDate(referral.rewardTriggeredAt)}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No referrals yet" description="Share your referral link to earn rewards." />
        )}
      </Card>
    </div>
  );
}
