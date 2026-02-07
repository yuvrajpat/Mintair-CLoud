"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";
import { api, ApiError } from "../lib/api";
import type { User } from "../lib/types";

type SessionContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const SESSION_QUERY_KEY = ["session"] as const;

async function fetchSessionUser() {
  try {
    const response = await api.auth.me();
    return response.user as User;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSessionUser
  });

  const value = useMemo<SessionContextValue>(
    () => ({
      user: data ?? null,
      loading: isLoading,
      isAuthenticated: Boolean(data),
      refreshSession: async () => {
        await queryClient.fetchQuery({
          queryKey: SESSION_QUERY_KEY,
          queryFn: fetchSessionUser
        });
      }
    }),
    [data, isLoading, queryClient]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside AuthProvider");
  }
  return context;
}
