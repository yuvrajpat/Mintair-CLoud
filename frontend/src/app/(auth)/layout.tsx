"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "../../components/session-provider";
import { Skeleton } from "../../components/ui/skeleton";
import { ThemeToggle } from "../../components/ui/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    router.replace(user.onboardingCompleted ? "/dashboard" : "/onboarding");
  }, [loading, router, user]);

  if (!loading && user) {
    return (
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-10">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="surface-card border-ink-300 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center bg-brand-charcoal font-mono text-xs uppercase tracking-[0.08em] text-brand-lime">
                MC
              </span>
              <div>
                <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink-900">Mintair Cloud</p>
                <p className="text-sm text-ink-500">Calm infrastructure command center</p>
              </div>
            </div>
            <ThemeToggle compact />
          </div>
        </div>

        <div className="mt-4 route-enter-forward">{children}</div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:mt-5 md:grid-cols-3">
          <div className="surface-card border-ink-300 p-4">
            <p className="eyebrow text-brand-blue">Secure</p>
            <p className="mt-2 text-sm text-ink-700">Session-based authentication with guarded workspace access.</p>
          </div>
          <div className="surface-card border-ink-300 p-4">
            <p className="eyebrow text-brand-blue">Fast</p>
            <p className="mt-2 text-sm text-ink-700">Sign in and continue directly to onboarding or active console.</p>
          </div>
          <div className="surface-card border-ink-300 p-4">
            <p className="eyebrow text-brand-blue">Reliable</p>
            <p className="mt-2 text-sm text-ink-700">Consistent behavior across desktop, mobile Safari, and Chrome.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
