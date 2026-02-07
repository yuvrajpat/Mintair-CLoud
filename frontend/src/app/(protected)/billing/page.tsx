"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { Input } from "../../../components/ui/input";
import { Modal } from "../../../components/ui/modal";
import { Select } from "../../../components/ui/select";
import { StatCard } from "../../../components/ui/stat-card";
import { api } from "../../../lib/api";
import { formatCurrency, formatDate } from "../../../lib/format";
import type { BillingOverview, CreditTopUp } from "../../../lib/types";

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [usageGroup, setUsageGroup] = useState<"instance" | "gpu" | "region">("instance");
  const [paymentModal, setPaymentModal] = useState(false);
  const [number, setNumber] = useState("4242424242424242");
  const [brand, setBrand] = useState("Visa");
  const [provider, setProvider] = useState("Stripe");
  const [expMonth, setExpMonth] = useState(12);
  const [expYear, setExpYear] = useState(new Date().getFullYear() + 2);

  const overviewQuery = useQuery({
    queryKey: ["billing-overview"],
    queryFn: () => api.billing.overview() as Promise<BillingOverview>
  });

  const usageQuery = useQuery({
    queryKey: ["billing-usage", usageGroup],
    queryFn: () =>
      api.billing.usage(usageGroup) as Promise<{
        usage: Array<{ label: string; quantity: number }>;
      }>
  });

  const topUpsQuery = useQuery({
    queryKey: ["billing-topups"],
    queryFn: () =>
      api.billing.topUps() as Promise<{
        topUps: CreditTopUp[];
      }>
  });

  const addPaymentMutation = useMutation({
    mutationFn: api.billing.addPaymentMethod,
    onSuccess: async (data) => {
      toast.success(data.message);
      setPaymentModal(false);
      await queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not add payment method";
      toast.error(message);
    }
  });

  const cancelTopUpMutation = useMutation({
    mutationFn: (topUpId: string) => api.billing.cancelTopUp(topUpId),
    onSuccess: async (data) => {
      toast.success(data.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing-topups"] }),
        queryClient.invalidateQueries({ queryKey: ["credits-summary"] })
      ]);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not cancel pending top-up.";
      toast.error(message);
    }
  });

  const usageTotal = useMemo(
    () => (usageQuery.data?.usage ?? []).reduce((sum, row) => sum + row.quantity, 0),
    [usageQuery.data?.usage]
  );

  const onAddPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addPaymentMutation.mutate({
      type: "CARD",
      provider,
      brand,
      number,
      expMonth,
      expYear,
      isDefault: true
    });
  };

  const getPendingHint = (topUp: CreditTopUp): string | null => {
    if (topUp.status !== "PENDING" || topUp.canCancel) {
      return null;
    }

    const eligibleAt = new Date(topUp.createdAt).getTime() + 60 * 60 * 1000;
    const remainingMs = eligibleAt - Date.now();
    if (remainingMs <= 0) {
      return null;
    }

    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    return `Can cancel in ~${remainingMinutes} min`;
  };

  if (!overviewQuery.data) {
    return <Card className="text-sm text-ink-500">Loading billing data...</Card>;
  }

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Current Balance" value={formatCurrency(overviewQuery.data.balance)} />
        <StatCard label="Monthly Spend" value={formatCurrency(overviewQuery.data.monthlySpend)} />
        <Card className="border-brand-gray">
          <p className="text-sm text-ink-500">Payment methods</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{overviewQuery.data.paymentMethods.length}</p>
          <Button className="mt-3" variant="secondary" onClick={() => setPaymentModal(true)}>
            Add payment method
          </Button>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-brand-gray">
          <div className="flex items-center justify-between">
            <h3 className="text-base text-ink-900">Invoices</h3>
          </div>
          {overviewQuery.data.invoices.length ? (
            <div className="mt-3 space-y-2">
              {overviewQuery.data.invoices.map((invoice) => (
                <div key={invoice.id} className="border border-brand-gray bg-white px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink-700">{invoice.id.slice(-8)}</span>
                    <span className="border border-brand-gray px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-blue">
                      {invoice.status}
                    </span>
                  </div>
                  <p className="mt-1 text-ink-600">
                    {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                  </p>
                  <p className="font-semibold text-ink-900">{formatCurrency(invoice.totalAmount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No invoices" description="Invoices will appear as monthly usage accumulates." />
          )}
        </Card>

        <Card className="border-brand-gray">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base text-ink-900">Usage breakdown</h3>
            <Select value={usageGroup} onChange={(event) => setUsageGroup(event.target.value as typeof usageGroup)} className="w-40">
              <option value="instance">By instance</option>
              <option value="gpu">By GPU</option>
              <option value="region">By region</option>
            </Select>
          </div>
          <p className="mt-1 text-sm text-ink-500">Total tracked GPU hours: {usageTotal.toFixed(2)}</p>
          {usageQuery.data?.usage.length ? (
            <div className="mt-3 space-y-2">
              {usageQuery.data.usage.map((row) => (
                <div key={row.label} className="border border-brand-gray px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-700">{row.label}</span>
                    <span className="text-sm font-semibold text-ink-900">{row.quantity.toFixed(2)} h</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">No usage data available.</p>
          )}
        </Card>
      </section>

      <section>
        <Card className="border-brand-gray">
          <h3 className="text-base text-ink-900">Recent billing records</h3>
          {overviewQuery.data.records.length ? (
            <div className="mt-3 space-y-2">
              {overviewQuery.data.records.map((record) => (
                <div key={record.id} className="flex flex-wrap items-center justify-between gap-2 border border-brand-gray px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-ink-800">{record.description}</p>
                    <p className="text-xs text-ink-400">{formatDate(record.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={record.amount < 0 ? "text-rose-600" : "text-emerald-600"}>{formatCurrency(record.amount)}</p>
                    <p className="text-xs text-ink-400">Balance: {formatCurrency(record.balanceAfter)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">No billing activity yet.</p>
          )}
        </Card>
      </section>

      <section>
        <Card className="border-brand-gray">
          <h3 className="text-base text-ink-900">Credit top-ups</h3>
          <p className="mt-1 text-sm text-ink-500">
            Paid top-ups reflect in balance automatically. Pending rows can be manually canceled after 1 hour.
          </p>
          {topUpsQuery.data?.topUps.length ? (
            <div className="mt-3 space-y-2">
              {topUpsQuery.data.topUps.map((topUp) => (
                <div
                  key={topUp.id}
                  className="flex flex-wrap items-center justify-between gap-3 border border-brand-gray bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800">{formatCurrency(topUp.amountUsd)}</p>
                    <p className="text-xs text-ink-500">{formatDate(topUp.createdAt)}</p>
                    {getPendingHint(topUp) ? (
                      <p className="text-xs text-ink-400">{getPendingHint(topUp)}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="border border-brand-gray px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-600">
                      {topUp.status}
                    </span>
                    {topUp.status === "PENDING" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!topUp.canCancel}
                        loading={cancelTopUpMutation.isPending}
                        loadingLabel="Canceling"
                        onClick={() => cancelTopUpMutation.mutate(topUp.id)}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">No credit top-ups yet.</p>
          )}
        </Card>
      </section>

      <Modal
        open={paymentModal}
        title="Add payment method"
        description="Payment processing is mocked in local mode."
        onClose={() => setPaymentModal(false)}
      >
        <form className="space-y-3" onSubmit={onAddPayment}>
          <Input placeholder="Provider" value={provider} onChange={(event) => setProvider(event.target.value)} required />
          <Input placeholder="Brand" value={brand} onChange={(event) => setBrand(event.target.value)} required />
          <Input placeholder="Card number" value={number} onChange={(event) => setNumber(event.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={1}
              max={12}
              value={expMonth}
              onChange={(event) => setExpMonth(Number(event.target.value))}
              required
            />
            <Input
              type="number"
              value={expYear}
              onChange={(event) => setExpYear(Number(event.target.value))}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPaymentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addPaymentMutation.isPending}>
              Save payment method
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
