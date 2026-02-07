"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "../../components/app-shell";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { Skeleton } from "../../components/ui/skeleton";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useRequireAuth();

  useEffect(() => {
    if (!loading && user && !user.onboardingCompleted && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }

    if (!loading && user && user.onboardingCompleted && pathname === "/onboarding") {
      router.replace("/dashboard");
    }
  }, [loading, pathname, router, user]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-10">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user.onboardingCompleted && pathname !== "/onboarding") {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
