"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./session-provider";

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
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 2600,
            style: {
              border: "1px solid rgba(73, 91, 103, 0.16)",
              background: "rgba(255, 255, 255, 0.96)",
              color: "#2d3740",
              borderRadius: "12px",
              boxShadow: "0 16px 40px -28px rgba(35, 47, 57, 0.45)",
              backdropFilter: "blur(5px)",
              padding: "10px 12px"
            }
          }}
        />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
