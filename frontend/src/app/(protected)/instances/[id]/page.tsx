"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, LoaderCircle, Terminal } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/empty-state";
import { Modal } from "../../../../components/ui/modal";
import { SimpleChart } from "../../../../components/ui/simple-chart";
import { Skeleton } from "../../../../components/ui/skeleton";
import { api } from "../../../../lib/api";
import { formatCurrency, formatDate } from "../../../../lib/format";
import type { Instance } from "../../../../lib/types";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "metrics", label: "Metrics" },
  { id: "ssh", label: "SSH" },
  { id: "logs", label: "Logs" },
  { id: "settings", label: "Settings" }
] as const;

type Tab = (typeof tabs)[number]["id"];

function statusTone(status: Instance["status"]) {
  if (status === "RUNNING") return "success" as const;
  if (status === "PROVISIONING" || status === "RESTARTING") return "warn" as const;
  if (status === "FAILED" || status === "TERMINATED") return "danger" as const;
  return "neutral" as const;
}

export const dynamic = "force-dynamic";

function InstanceDetailContent() {
  const params = useParams<{ id: string | string[] }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const instanceId = (Array.isArray(params.id) ? params.id[0] : params.id) ?? "";

  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [pendingAction, setPendingAction] = useState<"start" | "stop" | "restart" | "terminate" | null>(null);
  const tabParam = searchParams.get("tab");
  const currentTab = (tabs.some((tab) => tab.id === tabParam) ? tabParam : "overview") as Tab;

  const detailQuery = useQuery({
    queryKey: ["instance", instanceId],
    queryFn: () => api.instances.detail(instanceId) as Promise<{ instance: Instance }>,
    enabled: Boolean(instanceId),
    refetchInterval: 5000
  });

  const metricsQuery = useQuery({
    queryKey: ["instance-metrics", instanceId],
    queryFn: () =>
      api.instances.metrics(instanceId) as Promise<{
        datapoints: Array<{ timestamp: string; gpuHours: number }>;
        summary: { totalGpuHours: number };
      }>,
    enabled: currentTab === "metrics"
  });

  const logsQuery = useQuery({
    queryKey: ["instance-logs", instanceId],
    queryFn: () =>
      api.instances.logs(instanceId) as Promise<{ logs: Array<{ id: string; level: string; message: string; createdAt: string }> }>,
    enabled: currentTab === "logs",
    refetchInterval: 7000
  });

  const actionMutation = useMutation({
    mutationFn: async (action: "start" | "stop" | "restart" | "terminate") => {
      if (action === "start") return api.instances.start(instanceId);
      if (action === "stop") return api.instances.stop(instanceId);
      if (action === "restart") return api.instances.restart(instanceId);
      return api.instances.terminate(instanceId);
    },
    onMutate: (action) => {
      setPendingAction(action);
    },
    onSuccess: async (data) => {
      toast.success(data.message);
      setConfirmTerminate(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["instance", instanceId] }),
        queryClient.invalidateQueries({ queryKey: ["instances"] })
      ]);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Action failed.";
      toast.error(message);
    },
    onSettled: () => {
      setPendingAction(null);
    }
  });

  const metricsPoints = useMemo(() => {
    const points = metricsQuery.data?.datapoints ?? [];
    return points.slice(-12).map((point) => ({
      date: point.timestamp.slice(11, 16),
      value: point.gpuHours
    }));
  }, [metricsQuery.data?.datapoints]);

  const instance = detailQuery.data?.instance;

  if (detailQuery.isLoading) {
    return <Skeleton className="h-[34rem] w-full" />;
  }

  if (detailQuery.isError || !instance) {
    return <EmptyState title="Instance not found" description="This instance may have been removed or is no longer accessible." />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl text-ink-900">{instance.name}</h2>
              <Badge label={instance.status} tone={statusTone(instance.status)} />
            </div>
            <p className="mt-1 text-sm text-ink-500">
              {instance.marketplaceItem?.gpuType} in {instance.region} • {formatCurrency(instance.costPerHour)}/hr
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-ink-500">
              {instance.status === "PROVISIONING" || instance.status === "RESTARTING" ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin text-brand-blue" />
              ) : (
                <Activity className="h-3.5 w-3.5 text-brand-blue" />
              )}
              Updated {formatDate(instance.updatedAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {instance.status === "STOPPED" ? (
              <Button loading={pendingAction === "start"} loadingLabel="Starting" variant="secondary" onClick={() => actionMutation.mutate("start")}>
                Start
              </Button>
            ) : null}
            {instance.status === "RUNNING" ? (
              <Button loading={pendingAction === "stop"} loadingLabel="Stopping" variant="secondary" onClick={() => actionMutation.mutate("stop")}>
                Stop
              </Button>
            ) : null}
            {instance.status !== "TERMINATED" ? (
              <Button
                loading={pendingAction === "restart"}
                loadingLabel="Restarting"
                variant="secondary"
                onClick={() => actionMutation.mutate("restart")}
              >
                Restart
              </Button>
            ) : null}
            {instance.status !== "TERMINATED" ? (
              <Button variant="danger" onClick={() => setConfirmTerminate(true)}>
                Terminate
              </Button>
            ) : null}
          </div>
        </div>

        <div className="relative mt-5 overflow-x-auto">
          <div className="relative inline-flex min-w-full gap-1 border border-brand-gray bg-brand-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => router.replace(`/instances/${instanceId}?tab=${tab.id}`)}
                className={`relative z-10 h-9 flex-1 border px-3 font-mono text-[12px] uppercase tracking-[0.08em] transition ${
                  currentTab === tab.id
                    ? "border-brand-charcoal bg-brand-charcoal text-white"
                    : "border-transparent text-ink-500 hover:border-brand-gray hover:text-brand-blue"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div key={currentTab} className="tab-fade-enter">
        {currentTab === "overview" ? (
          <Card>
            <h3 className="text-base text-ink-900">Overview</h3>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-ink-600 md:grid-cols-2">
              <p>Instance ID: {instance.id}</p>
              <p>Image: {instance.image}</p>
              <p>Launched: {instance.launchedAt ? formatDate(instance.launchedAt) : "Not launched"}</p>
              <p>Last status change: {formatDate(instance.lastStatusChangeAt)}</p>
              <p>Provisioning ETA: {instance.provisioningEta ? formatDate(instance.provisioningEta) : "Not available"}</p>
              <p>Provider: {instance.marketplaceItem?.provider ?? "Unknown"}</p>
            </div>
            {instance.failureReason ? (
              <p className="mt-3 border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">{instance.failureReason}</p>
            ) : null}
          </Card>
        ) : null}

        {currentTab === "metrics" ? (
          <Card>
            <h3 className="text-base text-ink-900">Metrics</h3>
            {metricsQuery.isLoading ? (
              <Skeleton className="mt-3 h-56 w-full" />
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-500">
                  Total GPU hours (24h): <span className="font-semibold text-ink-900">{metricsQuery.data?.summary.totalGpuHours ?? 0}</span>
                </p>
                <div className="mt-3">
                  <SimpleChart title="GPU hours (24h)" points={metricsPoints.length ? metricsPoints : [{ date: "--", value: 0 }]} />
                </div>
              </>
            )}
          </Card>
        ) : null}

        {currentTab === "ssh" ? (
          <Card>
            <h3 className="text-base text-ink-900">SSH access</h3>
            {instance.sshKey ? (
              <div className="mt-3 space-y-1 text-sm text-ink-600">
                <p>Attached key: {instance.sshKey.name}</p>
                <p>Fingerprint: {instance.sshKey.fingerprint}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-500">No SSH key attached to this instance.</p>
            )}
            <Button className="mt-4" variant="secondary" onClick={() => router.push("/ssh-keys")}>
              Manage SSH keys
            </Button>
          </Card>
        ) : null}

        {currentTab === "logs" ? (
          <Card>
            <h3 className="text-base text-ink-900">Runtime logs</h3>
            {logsQuery.isLoading ? (
              <Skeleton className="mt-3 h-56 w-full" />
            ) : logsQuery.data?.logs.length ? (
              <div className="mt-3 space-y-2">
                {logsQuery.data.logs.map((log) => (
                  <div key={log.id} className="border border-brand-gray bg-brand-white px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">{log.level}</p>
                    <p className="mt-1 text-sm text-ink-700">{log.message}</p>
                    <p className="mt-1 text-xs text-ink-500">{formatDate(log.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 border border-brand-gray bg-brand-white px-3 py-3 text-sm text-ink-500">
                <Terminal className="h-4 w-4" />
                No logs available yet.
              </div>
            )}
          </Card>
        ) : null}

        {currentTab === "settings" ? (
          <Card>
            <h3 className="text-base text-ink-900">Instance settings</h3>
            <p className="mt-2 text-sm text-ink-500">Use lifecycle controls here when you need safe resets or decommissioning.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                loading={pendingAction === "restart"}
                loadingLabel="Restarting"
                onClick={() => actionMutation.mutate("restart")}
              >
                Restart instance
              </Button>
              <Button variant="danger" onClick={() => setConfirmTerminate(true)}>
                Terminate instance
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      <Modal
        open={confirmTerminate}
        title="Terminate this instance"
        description="This action cannot be undone. Compute and billing for this instance will stop immediately."
        onClose={() => setConfirmTerminate(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmTerminate(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={pendingAction === "terminate"}
              loadingLabel="Terminating"
              onClick={() => actionMutation.mutate("terminate")}
            >
              Confirm termination
            </Button>
          </>
        }
      />
    </div>
  );
}

export default function InstanceDetailPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[34rem] w-full" />}>
      <InstanceDetailContent />
    </Suspense>
  );
}
