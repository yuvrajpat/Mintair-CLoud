"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./session-provider";
import { ThemeProvider, useTheme } from "./theme-provider";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 2600,
        style: {
          border: dark ? "1px solid rgba(120, 132, 151, 0.35)" : "1px solid rgba(73, 91, 103, 0.16)",
          background: dark ? "rgba(16, 20, 28, 0.98)" : "rgba(255, 255, 255, 0.96)",
          color: dark ? "#dce2ee" : "#2d3740",
          borderRadius: "0px",
          boxShadow: dark ? "0 18px 45px -30px rgba(0, 0, 0, 0.65)" : "0 16px 40px -28px rgba(35, 47, 57, 0.45)",
          backdropFilter: "blur(5px)",
          padding: "10px 12px"
        }
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false
          },
          mutations: {
            retry: 0
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
