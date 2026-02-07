"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "../../../components/session-provider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { api } from "../../../lib/api";
import type { User } from "../../../lib/types";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { refreshSession } = useSession();
  const [email, setEmail] = useState("alice@mintair.dev");
  const [password, setPassword] = useState("Mintair123!");
  const seenGoogleError = useRef<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (result) => {
      const user = (result.user as User) ?? null;
      if (user) {
        queryClient.setQueryData(["session"], user);
      }

      const target = user?.onboardingCompleted ? "/dashboard" : "/onboarding";
      toast.success("Welcome back.");
      router.replace(target);

      void refreshSession().catch(() => {
        // Non-blocking refresh to avoid trapping users on auth page.
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      toast.error(message);
    }
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({ email, password });
  };

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error || seenGoogleError.current === error) {
      return;
    }

    seenGoogleError.current = error;
    const message =
      error === "google_state_invalid"
        ? "Google sign-in expired. Please try again."
        : error === "google_not_configured"
          ? "Google sign-in is not configured yet."
          : error === "google_auth_failed"
            ? "Google sign-in failed. Please try again."
            : "Unable to complete Google sign-in.";
    toast.error(message);
  }, [searchParams]);

  const startGoogleLogin = () => {
    window.location.href = "/api/auth/google/start";
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.94fr_1.06fr]">
      <Card className="mx-auto w-full max-w-xl border-brand-gray bg-brand-white">
        <div className="mb-5">
          <p className="eyebrow text-brand-blue">Welcome back</p>
          <h3 className="mt-2 text-[2rem] leading-[1.1] text-ink-900">Sign in</h3>
          <p className="mt-2 text-sm text-ink-500">Access your Mintair Cloud workspace.</p>
        </div>

        <form className="space-y-3.5" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                type="email"
                className="pl-9"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                type="password"
                className="pl-9"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          <Button type="submit" className="w-full" loading={loginMutation.isPending} loadingLabel="Signing in">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-brand-gray" />
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-500">or</span>
            <span className="h-px flex-1 bg-brand-gray" />
          </div>

          <Button type="button" variant="secondary" className="w-full" onClick={startGoogleLogin}>
            <span className="inline-flex h-5 w-5 items-center justify-center border border-brand-charcoal bg-brand-white text-[11px] font-semibold">
              G
            </span>
            Continue with Google
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
          <Link className="font-medium text-brand-blue transition hover:text-brand-blue hover:underline" href="/forgot-password">
            Forgot password?
          </Link>
          <Link className="font-medium text-brand-blue transition hover:text-brand-blue hover:underline" href="/signup">
            Create account
          </Link>
        </div>

        <div className="mt-5 border border-brand-gray bg-brand-white px-3 py-2 text-xs text-ink-600">
          <span className="inline-flex items-center gap-1 font-medium text-ink-700">
            <Sparkles className="h-3.5 w-3.5 text-brand-lime" />
            Tip
          </span>{" "}
          If you were redirected from verification, sign in and continue onboarding.
        </div>
      </Card>

      <Card className="overflow-hidden border-brand-charcoal bg-brand-charcoal p-0 text-white">
        <div className="relative h-full bg-[radial-gradient(circle_at_14%_16%,rgba(6,182,212,0.16),transparent_40%),radial-gradient(circle_at_78%_18%,rgba(37,99,235,0.28),transparent_45%),linear-gradient(180deg,#171b23_0%,#13161d_100%)] px-6 py-7 sm:px-7 sm:py-8 md:px-9 md:py-10">
          <p className="eyebrow text-brand-cyan">Control Plane</p>
          <h2 className="mt-3 max-w-xl text-[1.7rem] leading-[1.15] text-white sm:text-[2rem] md:text-[2.35rem]">
            Enterprise-grade infrastructure access.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
            Run deployments, monitor usage, and manage spend from a single purpose-built command surface.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-2 text-sm text-white/80 sm:mt-8 sm:grid-cols-2">
            <div className="border border-brand-cyan/35 bg-white/5 px-3 py-3">
              <p className="font-medium text-white">Session security</p>
              <p className="mt-0.5 text-xs text-white/70">Rotating auth tokens with server-side revocation.</p>
            </div>
            <div className="border border-brand-cyan/35 bg-white/5 px-3 py-3">
              <p className="font-medium text-white">Operational clarity</p>
              <p className="mt-0.5 text-xs text-white/70">Unified view across regions and compute profiles.</p>
            </div>
          </div>

          <div className="mt-6 border-t border-white/20 pt-4 text-xs text-white/65 sm:mt-7">
            Trusted by teams running high-uptime GPU workloads.
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card className="mx-auto max-w-xl text-sm text-ink-500">Loading login…</Card>}>
      <LoginPageContent />
    </Suspense>
  );
}
