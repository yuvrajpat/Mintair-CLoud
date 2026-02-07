"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "../components/session-provider";

export function useRequireAuth() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (!session.loading && !session.isAuthenticated) {
      router.replace("/login");
    }
  }, [router, session.isAuthenticated, session.loading]);

  return session;
}
