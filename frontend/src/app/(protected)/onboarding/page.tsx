"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Globe2, Layers3, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "../../../components/session-provider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Select } from "../../../components/ui/select";
import { Skeleton } from "../../../components/ui/skeleton";
import { api } from "../../../lib/api";
import type { User } from "../../../lib/types";

const userTypes = ["Developer", "Startup", "Enterprise", "Research Lab"];
const useCases = ["LLM training", "Fine-tuning", "Inference", "Computer vision", "Rendering", "Batch ML"];
const regions = ["us-east-1", "us-east-2", "us-west-2", "us-central-1", "eu-west-1", "ap-south-1"];
const stepLabels = ["Welcome", "Team type", "Use case", "Region"];

type OnboardingState = {
  onboardingCompleted: boolean;
  onboardingUserType: string | null;
  onboardingUseCase: string | null;
  onboardingRegion: string | null;
};

type OnboardingCompleteResponse = {
  message: string;
  state: OnboardingState;
};

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshSession } = useSession();

  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(userTypes[0]);
  const [useCase, setUseCase] = useState(useCases[0]);
  const [region, setRegion] = useState(regions[0]);

  const stateQuery = useQuery({
    queryKey: ["onboarding-state"],
    queryFn: () => api.onboarding.state() as Promise<{ state: OnboardingState }>
  });

  useEffect(() => {
    const state = stateQuery.data?.state;
    if (!state) {
      return;
    }

    if (state.onboardingUserType && userTypes.includes(state.onboardingUserType)) {
      setUserType(state.onboardingUserType);
    }

    if (state.onboardingUseCase && useCases.includes(state.onboardingUseCase)) {
      setUseCase(state.onboardingUseCase);
    }

    if (state.onboardingRegion && regions.includes(state.onboardingRegion)) {
      setRegion(state.onboardingRegion);
    }
  }, [stateQuery.data?.state]);

  const completeMutation = useMutation({
    mutationFn: api.onboarding.complete,
    onSuccess: async (data) => {
      const response = data as OnboardingCompleteResponse;

      queryClient.setQueryData(["onboarding-state"], { state: response.state });
      queryClient.setQueryData(["session"], (current: User | null | undefined) => {
        if (!current) {
          return current ?? null;
        }

        return {
          ...current,
          onboardingCompleted: response.state.onboardingCompleted,
          onboardingUserType: response.state.onboardingUserType,
          onboardingUseCase: response.state.onboardingUseCase,
          onboardingRegion: response.state.onboardingRegion,
          preferredRegion: response.state.onboardingRegion ?? current.preferredRegion ?? null
        };
      });

      await refreshSession();
      toast.success("Workspace configured.");
      router.replace("/dashboard");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not finish onboarding.";
      toast.error(message);
    }
  });

  const completion = useMemo(() => (step / 4) * 100, [step]);

  if (stateQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[26rem] w-full" />
      </div>
    );
  }

  if (stateQuery.data?.state.onboardingCompleted) {
    return (
      <Card className="mx-auto max-w-xl border-brand-gray text-center">
        <div className="mx-auto inline-flex h-11 w-11 items-center justify-center border border-brand-charcoal bg-brand-charcoal text-brand-lime">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-xl text-ink-900">Workspace ready</h2>
        <p className="mt-1 text-sm text-ink-500">Your onboarding is complete and defaults are saved.</p>
        <div className="mt-5">
          <Button onClick={() => router.push("/dashboard")}>
            Open dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="relative overflow-hidden border-brand-gray">
        <div className="spectrum-bar absolute inset-x-0 top-0 h-1" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-brand-blue">Workspace setup</p>
            <h2 className="mt-2 text-2xl text-ink-900">Make Mintair Cloud feel native to your team.</h2>
            <p className="mt-1 text-sm text-ink-500">One minute now saves repeated configuration in every deployment flow.</p>
          </div>
          <span className="inline-flex items-center border border-brand-gray bg-white px-3 py-1 font-mono text-[12px] uppercase tracking-[0.08em] text-brand-charcoal">
            Step {step} of 4
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-4">
          {stepLabels.map((label, index) => (
            <div
              key={label}
              className={`border px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] transition-all ${
                step >= index + 1 ? "border-brand-charcoal bg-brand-charcoal text-white" : "border-brand-gray bg-white text-ink-400"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-4 h-1.5 overflow-hidden border border-brand-gray bg-white">
          <div className="spectrum-bar h-full transition-[width] duration-300 ease-out" style={{ width: `${completion}%` }} />
        </div>
      </Card>

      <Card className="deploy-step-enter border-brand-gray">
        {step === 1 ? (
          <div className="space-y-4">
            <div className="inline-flex h-10 w-10 items-center justify-center border border-brand-charcoal bg-brand-charcoal text-brand-lime">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-xl text-ink-900">Welcome to Mintair Cloud</h3>
            <p className="max-w-2xl text-sm leading-relaxed text-ink-600">
              We will set your default environment profile so launch forms, region choices, and usage views are aligned with your
              normal workflow from day one.
            </p>
            <div className="grid grid-cols-1 gap-2 text-sm text-ink-600 md:grid-cols-3">
              <p className="border border-brand-gray bg-white px-3 py-2">Profile-aware defaults</p>
              <p className="border border-brand-gray bg-white px-3 py-2">Region pre-selection</p>
              <p className="border border-brand-gray bg-white px-3 py-2">Faster deployments</p>
            </div>
            <Button onClick={() => setStep(2)}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="inline-flex h-10 w-10 items-center justify-center border border-brand-charcoal bg-brand-charcoal text-brand-lime">
              <Layers3 className="h-5 w-5" />
            </div>
            <h3 className="text-xl text-ink-900">Which team profile fits best?</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {userTypes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setUserType(option)}
                  className={`border px-4 py-3 text-left text-sm transition ${
                    option === userType
                      ? "border-brand-charcoal bg-brand-charcoal text-white"
                      : "border-brand-gray bg-white text-ink-700 hover:border-brand-charcoal"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="inline-flex h-10 w-10 items-center justify-center border border-brand-charcoal bg-brand-charcoal text-brand-lime">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-xl text-ink-900">Primary infrastructure use case</h3>
            <Select value={useCase} onChange={(event) => setUseCase(event.target.value)}>
              {useCases.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <p className="text-sm text-ink-500">This powers recommendation ordering in the marketplace and deployment presets.</p>
            <div className="flex justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="inline-flex h-10 w-10 items-center justify-center border border-brand-charcoal bg-brand-charcoal text-brand-lime">
              <Globe2 className="h-5 w-5" />
            </div>
            <h3 className="text-xl text-ink-900">Preferred deployment region</h3>
            <Select value={region} onChange={(event) => setRegion(event.target.value)}>
              {regions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <p className="text-sm text-ink-500">You can always override this per instance, but this will be your default.</p>

            <div className="border border-brand-gray bg-white px-4 py-3 text-sm">
              <p className="font-medium text-ink-800">Summary</p>
              <p className="mt-1 text-ink-600">
                {userType} team focused on {useCase}, defaulting to {region}.
              </p>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                loading={completeMutation.isPending}
                loadingLabel="Saving"
                onClick={() => completeMutation.mutate({ userType, useCase, region })}
              >
                Complete setup
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
