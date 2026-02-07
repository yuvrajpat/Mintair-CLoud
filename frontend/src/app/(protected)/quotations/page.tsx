"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { api } from "../../../lib/api";
import { formatDate } from "../../../lib/format";
import type { QuoteRequest } from "../../../lib/types";

function tone(status: QuoteRequest["status"]) {
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED") return "danger" as const;
  return "warn" as const;
}

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const [gpuType, setGpuType] = useState("NVIDIA H100");
  const [quantity, setQuantity] = useState(8);
  const [durationHours, setDurationHours] = useState(720);
  const [region, setRegion] = useState("us-east-1");
  const [notes, setNotes] = useState("");

  const quotesQuery = useQuery({
    queryKey: ["quotes"],
    queryFn: () => api.quotes.list() as Promise<{ quotes: QuoteRequest[] }>
  });

  const createMutation = useMutation({
    mutationFn: api.quotes.create,
    onSuccess: async (data) => {
      toast.success(data.message);
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not submit quote.";
      toast.error(message);
    }
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: "PENDING" | "APPROVED" | "REJECTED" }) =>
      api.quotes.updateStatus(payload.id, { status: payload.status }),
    onSuccess: async (data) => {
      toast.success(data.message);
      await queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not update quote status.";
      toast.error(message);
    }
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({ gpuType, quantity, durationHours, region, notes });
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-base font-semibold text-ink-900">Request custom quotation</h3>
        <p className="mt-1 text-sm text-ink-500">Get pricing for reserved or custom infrastructure.</p>
        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <Input value={gpuType} onChange={(event) => setGpuType(event.target.value)} placeholder="GPU type" required />
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            placeholder="Quantity"
            required
          />
          <Input
            type="number"
            min={1}
            value={durationHours}
            onChange={(event) => setDurationHours(Number(event.target.value))}
            placeholder="Duration hours"
            required
          />
          <Input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Region" required />
          <div className="md:col-span-2">
            <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" loading={createMutation.isPending}>
              Submit quotation request
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-ink-900">Quote requests</h3>
        {quotesQuery.data?.quotes.length ? (
          <div className="mt-3 space-y-2">
            {quotesQuery.data.quotes.map((quote) => (
              <div key={quote.id} className="rounded-xl border border-ink-100 px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink-800">
                    {quote.gpuType} x {quote.quantity} ({quote.durationHours}h)
                  </p>
                  <Badge label={quote.status} tone={tone(quote.status)} />
                </div>
                <p className="mt-1 text-ink-500">{quote.region}</p>
                {quote.notes ? <p className="mt-1 text-ink-600">{quote.notes}</p> : null}
                {quote.reviewNotes ? <p className="mt-1 text-ink-600">Review: {quote.reviewNotes}</p> : null}
                <p className="mt-1 text-xs text-ink-400">Submitted {formatDate(quote.createdAt)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Select
                    value={quote.status}
                    onChange={(event) =>
                      statusMutation.mutate({
                        id: quote.id,
                        status: event.target.value as "PENDING" | "APPROVED" | "REJECTED"
                      })
                    }
                    className="w-44"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No quote requests" description="Submit a quotation request to receive a custom pricing response." />
        )}
      </Card>
    </div>
  );
}
