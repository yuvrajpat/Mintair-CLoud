"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "../../components/session-provider";
import { Skeleton } from "../../components/ui/skeleton";

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
    <div className="min-h-screen px-4 py-10 md:px-6 md:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="surface-card mb-8 border-ink-300 px-6 py-7 md:px-8 md:py-9">
          <p className="eyebrow text-brand-blue">Mintair Cloud</p>
          <h1 className="mt-3 max-w-2xl text-3xl leading-tight text-ink-900 md:text-[2.35rem]">
            AI infrastructure command for modern enterprise teams.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 md:text-[15px]">
            Authenticate once, onboard fast, and operate deployments with predictable cost visibility.
          </p>
        </div>

        <div className="route-enter-forward">{children}</div>
      </div>
    </div>
  );
}
