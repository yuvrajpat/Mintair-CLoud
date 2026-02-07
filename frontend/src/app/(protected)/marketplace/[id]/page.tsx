"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Cpu, LoaderCircle, Server, ShieldAlert, Sparkles } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/empty-state";
import { Input } from "../../../../components/ui/input";
import { Select } from "../../../../components/ui/select";
import { Skeleton } from "../../../../components/ui/skeleton";
import { api } from "../../../../lib/api";
import { formatCurrency } from "../../../../lib/format";
import type { Instance, MarketplaceItem, SSHKey } from "../../../../lib/types";

const imageOptions = ["ubuntu-22.04-cuda-12", "ubuntu-24.04-cuda-12", "debian-12-pytorch", "rockylinux-9-rocm"];
const flowSteps = ["Configuration", "Cost summary", "Confirmation", "Provisioning", "Result"];

type EstimateResponse = {
  breakdown: {
    compute: number;
    storage: number;
    tax: number;
    total: number;
  };
};

export const dynamic = "force-dynamic";

function statusTone(status: Instance["status"]) {
  if (status === "RUNNING") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  return "warn" as const;
}

function MarketplaceDetailContent() {
  const params = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const autoDeploy = searchParams.get("deploy") === "1";
  const itemId = (Array.isArray(params.id) ? params.id[0] : params.id) ?? "";

  const [step, setStep] = useState(1);
  const [name, setName] = useState("mintair-instance");
  const [region, setRegion] = useState("us-east-1");
  const [image, setImage] = useState(imageOptions[0]);
  const [hours, setHours] = useState(24);
  const [quantity, setQuantity] = useState(1);
  const [sshKeyId, setSshKeyId] = useState("");
  const [deployedInstanceId, setDeployedInstanceId] = useState<string | null>(null);

  const itemQuery = useQuery({
    queryKey: ["marketplace-item", itemId],
    queryFn: () => api.marketplace.detail(itemId) as Promise<{ item: MarketplaceItem }>,
    enabled: Boolean(itemId)
  });

  useEffect(() => {
    if (!itemQuery.data?.item.region) {
      return;
    }

    setRegion(itemQuery.data.item.region);
    if (autoDeploy) {
      setStep(1);
    }
  }, [autoDeploy, itemQuery.data?.item.region]);

  const sshKeysQuery = useQuery({
    queryKey: ["ssh-keys"],
    queryFn: () => api.sshKeys.list() as Promise<{ keys: SSHKey[] }>
  });

  const estimateMutation = useMutation({
    mutationFn: () => api.marketplace.estimate(itemId, { hours, quantity }) as Promise<EstimateResponse>,
    onSuccess: () => setStep(2),
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not estimate cost.";
      toast.error(message);
    }
  });

  const deployMutation = useMutation({
    mutationFn: () =>
      api.instances.deploy({
        marketplaceItemId: itemId,
        name,
        region,
        image,
        sshKeyId: sshKeyId || undefined
      }) as Promise<{ message: string; instance: Instance }>,
    onSuccess: async (data) => {
      setDeployedInstanceId(data.instance.id);
      setStep(4);
      toast.success("Deployment started.");
      await queryClient.invalidateQueries({ queryKey: ["instances"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Deployment failed.";
      toast.error(message);
      setStep(5);
    }
  });

  const deployedInstanceQuery = useQuery({
    queryKey: ["instance", deployedInstanceId],
    queryFn: () => api.instances.detail(deployedInstanceId!) as Promise<{ instance: Instance }>,
    enabled: Boolean(deployedInstanceId),
    refetchInterval: 3500
  });

  useEffect(() => {
    const status = deployedInstanceQuery.data?.instance.status;
    if (!status) {
      return;
    }

    if (status === "RUNNING") {
      setStep(5);
      toast.success("Instance is ready.");
    }

    if (status === "FAILED") {
      setStep(5);
      toast.error("Provisioning failed.");
    }
  }, [deployedInstanceQuery.data?.instance.status]);

  const estimateData = estimateMutation.data;
  const deploymentResult = deployedInstanceQuery.data?.instance;
  const activeStep = Math.min(step, 5);

  const progress = useMemo(() => (activeStep / flowSteps.length) * 100, [activeStep]);

  if (itemQuery.isLoading) {
    return <Skeleton className="h-[34rem] w-full" />;
  }

  if (itemQuery.isError || !itemQuery.data?.item) {
    return <EmptyState title="Marketplace item not found" description="Select another compute profile from the marketplace." />;
  }

  const item = itemQuery.data.item;
  const isFailure = step === 5 && deploymentResult?.status !== "RUNNING";

  return (
    <div className="space-y-4">
      <Card className="relative border-brand-gray">
        <div className="spectrum-bar absolute inset-x-0 top-0 h-1" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-brand-blue">Deployment profile</p>
            <h2 className="mt-2 text-2xl text-ink-900">{item.name}</h2>
            <p className="mt-1 text-sm text-ink-500">
              {item.gpuType} by {item.provider} in {item.region}
            </p>
          </div>
          <div className="border border-brand-gray bg-brand-white px-4 py-3 text-right">
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-brand-blue">Price per hour</p>
            <p className="mt-1 text-lg text-ink-900">{formatCurrency(item.pricePerHour)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <div className="border border-brand-gray bg-brand-white px-3 py-2 text-ink-700">VRAM: {item.vramGb} GB</div>
          <div className="border border-brand-gray bg-brand-white px-3 py-2 text-ink-700">CPU: {item.cpuCores} cores</div>
          <div className="border border-brand-gray bg-brand-white px-3 py-2 text-ink-700">Memory: {item.memoryGb} GB</div>
          <div className="border border-brand-gray bg-brand-white px-3 py-2 text-ink-700">Storage: {item.storageGb} GB</div>
        </div>
      </Card>

      <Card className="border-brand-gray">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink-700">Launch flow</p>
          <span className="border border-brand-gray bg-brand-white px-3 py-1 font-mono text-[12px] uppercase tracking-[0.08em] text-ink-500">
            Step {activeStep} of 5
          </span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden border border-brand-gray bg-brand-white">
          <div className="spectrum-bar h-full transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-5">
          {flowSteps.map((label, index) => (
            <div
              key={label}
              className={`border px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] transition-all ${
                activeStep >= index + 1 ? "border-brand-charcoal bg-brand-charcoal text-white" : "border-brand-gray bg-brand-white text-ink-400"
              }`}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div className="deploy-step-enter mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Instance name</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Region</label>
              <Input value={region} onChange={(event) => setRegion(event.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Image template</label>
              <Select value={image} onChange={(event) => setImage(event.target.value)}>
                {imageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">SSH key (optional)</label>
              <Select value={sshKeyId} onChange={(event) => setSshKeyId(event.target.value)}>
                <option value="">No SSH key</option>
                {(sshKeysQuery.data?.keys ?? []).map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name} ({key.fingerprint.slice(0, 18)}...)
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Estimated hours</label>
              <Input type="number" min={1} value={hours} onChange={(event) => setHours(Math.max(1, Number(event.target.value)))} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Quantity</label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
              />
            </div>

            <div className="md:col-span-2">
              <Button loading={estimateMutation.isPending} loadingLabel="Estimating" onClick={() => estimateMutation.mutate()}>
                Estimate cost
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 && estimateData ? (
          <div className="deploy-step-enter mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
              <div className="border border-brand-gray bg-brand-white px-3 py-3">
                <p className="text-xs text-ink-500">Compute</p>
                <p className="mt-1 text-sm font-semibold text-ink-900 metric-enter">{formatCurrency(estimateData.breakdown.compute)}</p>
              </div>
              <div className="border border-brand-gray bg-brand-white px-3 py-3">
                <p className="text-xs text-ink-500">Storage</p>
                <p className="mt-1 text-sm font-semibold text-ink-900 metric-enter">{formatCurrency(estimateData.breakdown.storage)}</p>
              </div>
              <div className="border border-brand-gray bg-brand-white px-3 py-3">
                <p className="text-xs text-ink-500">Tax</p>
                <p className="mt-1 text-sm font-semibold text-ink-900 metric-enter">{formatCurrency(estimateData.breakdown.tax)}</p>
              </div>
              <div className="border border-brand-charcoal bg-brand-charcoal px-3 py-3">
                <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-brand-lime">Total</p>
                <p className="mt-1 text-sm font-semibold text-white metric-enter">{formatCurrency(estimateData.breakdown.total)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="deploy-step-enter mt-5 space-y-4">
            <div className="border border-brand-gray bg-brand-white px-4 py-4">
              <p className="text-sm text-ink-600">
                You are deploying <span className="font-semibold text-ink-900">{name}</span> in{" "}
                <span className="font-semibold text-ink-900">{region}</span> using{" "}
                <span className="font-semibold text-ink-900">{item.gpuType}</span>.
              </p>
              {estimateData ? (
                <p className="mt-2 text-sm text-ink-500">
                  Estimated total for {quantity} instance(s) over {hours} hours:{" "}
                  <span className="font-semibold text-ink-900">{formatCurrency(estimateData.breakdown.total)}</span>
                </p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                loading={deployMutation.isPending}
                loadingLabel="Launching"
                onClick={() => {
                  setStep(4);
                  deployMutation.mutate();
                }}
              >
                Confirm deployment
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="deploy-step-enter mt-5 space-y-4">
            <div className="flex items-center gap-3 border border-brand-gray bg-brand-white px-4 py-3">
              <LoaderCircle className="h-4 w-4 animate-spin text-brand-blue" />
              <p className="text-sm text-ink-600">Provisioning is in progress. We are syncing runtime status in real time.</p>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="border border-brand-gray bg-brand-white px-3 py-3">
                <p className="text-xs text-ink-500">Profile</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">{item.gpuType}</p>
              </div>
              <div className="border border-brand-gray bg-brand-white px-3 py-3">
                <p className="text-xs text-ink-500">Instance name</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">{name}</p>
              </div>
              <div className="border border-brand-gray bg-brand-white px-3 py-3">
                <p className="text-xs text-ink-500">Region</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">{region}</p>
              </div>
            </div>

            {deploymentResult ? (
              <div className="flex items-center gap-2 text-sm">
                <Badge label={deploymentResult.status} tone={statusTone(deploymentResult.status)} />
                <span className="text-ink-500">ID: {deploymentResult.id}</span>
              </div>
            ) : (
              <Skeleton className="h-8 w-full" />
            )}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="deploy-step-enter mt-5 space-y-4">
            {deploymentResult?.status === "RUNNING" ? (
              <>
                <div className="border border-brand-gray bg-brand-white px-4 py-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-blue" />
                    <p className="text-sm font-medium text-ink-800">Deployment complete. Your instance is live.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => router.push(`/instances/${deploymentResult.id}`)}>
                    <Server className="h-4 w-4" />
                    Open instance
                  </Button>
                  <Button variant="secondary" onClick={() => router.push("/instances")}>
                    View all instances
                  </Button>
                </div>
              </>
            ) : (
              <div className="border border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 px-4 py-4">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-rose-700 dark:text-rose-400" />
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-rose-800 dark:text-rose-300">Deployment did not complete successfully.</p>
                    <p className="text-sm text-rose-700 dark:text-rose-400">
                      {deploymentResult?.failureReason ?? "Please retry with a different profile or region."}
                    </p>
                    <Button variant="secondary" onClick={() => setStep(1)}>
                      <Sparkles className="h-4 w-4" />
                      Retry deployment
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {isFailure && !deploymentResult ? (
          <div className="mt-5 border border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-rose-800 dark:text-rose-400">
              <Cpu className="h-4 w-4" />
              Unable to retrieve deployment status. Please retry.
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default function MarketplaceDetailPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <MarketplaceDetailContent />
    </Suspense>
  );
}
