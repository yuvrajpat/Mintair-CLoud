"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ChevronRight, LoaderCircle, Power, RotateCcw, Square } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { Modal } from "../../../components/ui/modal";
import { Skeleton } from "../../../components/ui/skeleton";
import { api } from "../../../lib/api";
import { formatCurrency, formatDate } from "../../../lib/format";
import type { Instance } from "../../../lib/types";

function statusTone(status: Instance["status"]) {
  if (status === "RUNNING") return "success" as const;
  if (status === "PROVISIONING" || status === "RESTARTING") return "warn" as const;
  if (status === "FAILED" || status === "TERMINATED") return "danger" as const;
  return "neutral" as const;
}

export default function InstancesPage() {
  const queryClient = useQueryClient();
  const [terminateId, setTerminateId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: "start" | "stop" | "restart" | "terminate";
  } | null>(null);

  const instancesQuery = useQuery({
    queryKey: ["instances"],
    queryFn: () => api.instances.list() as Promise<{ instances: Instance[] }>,
    refetchInterval: 7000
  });

  const actionMutation = useMutation({
    mutationFn: async (payload: { id: string; action: "start" | "stop" | "restart" | "terminate" }) => {
      if (payload.action === "start") return api.instances.start(payload.id);
      if (payload.action === "stop") return api.instances.stop(payload.id);
      if (payload.action === "restart") return api.instances.restart(payload.id);
      return api.instances.terminate(payload.id);
    },
    onMutate: (payload) => {
      setPendingAction(payload);
    },
    onSuccess: async (data) => {
      toast.success(data.message);
      setTerminateId(null);
      await queryClient.invalidateQueries({ queryKey: ["instances"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Action failed.";
      toast.error(message);
    },
    onSettled: () => {
      setPendingAction(null);
    }
  });

  const instances = useMemo(() => instancesQuery.data?.instances ?? [], [instancesQuery.data?.instances]);
  const isPendingTerminate = pendingAction?.action === "terminate" && pendingAction?.id === terminateId;

  if (instancesQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!instances.length) {
    return <EmptyState title="No active infrastructure yet" description="Deploy your first compute profile from the marketplace." />;
  }

  return (
    <>
      <div className="space-y-3">
        {instances.map((instance) => {
          const isPendingForInstance = pendingAction?.id === instance.id;
          const statusLabel =
            instance.status === "PROVISIONING" || instance.status === "RESTARTING" ? "Syncing state..." : "State synchronized";

          return (
            <Card key={instance.id} className="relative overflow-hidden border-brand-gray">
              <div className="spectrum-bar absolute inset-x-0 top-0 h-1" />
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg text-ink-900">{instance.name}</h3>
                    <Badge label={instance.status} tone={statusTone(instance.status)} />
                  </div>
                  <p className="text-sm text-ink-500">
                    {instance.marketplaceItem?.gpuType} in {instance.region} • {formatCurrency(instance.costPerHour)}/hr
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      {instance.status === "PROVISIONING" || instance.status === "RESTARTING" ? (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-brand-blue" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-brand-blue" />
                      )}
                      {statusLabel}
                    </span>
                    <span>Updated {formatDate(instance.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {instance.status === "STOPPED" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={isPendingForInstance && pendingAction?.action === "start"}
                      loadingLabel="Starting"
                      onClick={() => actionMutation.mutate({ id: instance.id, action: "start" })}
                    >
                      <Power className="h-4 w-4" />
                      Start
                    </Button>
                  ) : null}

                  {instance.status === "RUNNING" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={isPendingForInstance && pendingAction?.action === "stop"}
                      loadingLabel="Stopping"
                      onClick={() => actionMutation.mutate({ id: instance.id, action: "stop" })}
                    >
                      <Square className="h-4 w-4" />
                      Stop
                    </Button>
                  ) : null}

                  {instance.status !== "TERMINATED" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={isPendingForInstance && pendingAction?.action === "restart"}
                      loadingLabel="Restarting"
                      onClick={() => actionMutation.mutate({ id: instance.id, action: "restart" })}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restart
                    </Button>
                  ) : null}

                  {instance.status !== "TERMINATED" ? (
                    <Button size="sm" variant="danger" onClick={() => setTerminateId(instance.id)}>
                      Terminate
                    </Button>
                  ) : null}

                  <Link href={`/instances/${instance.id}`}>
                    <Button size="sm">
                      Open
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(terminateId)}
        title="Terminate instance"
        description="This action is irreversible. Terminating will stop billing and runtime immediately."
        onClose={() => setTerminateId(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setTerminateId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isPendingTerminate}
              loadingLabel="Terminating"
              onClick={() => {
                if (terminateId) {
                  actionMutation.mutate({ id: terminateId, action: "terminate" });
                }
              }}
            >
              Confirm termination
            </Button>
          </>
        }
      />
    </>
  );
}
