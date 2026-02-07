import { API_BASE_URL } from "./env";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: string }).error)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

function resolveApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  }

  // Browser requests should stay same-origin so cookies are first-party.
  return "";
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl()}/api${path}`, {
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  return parseResponse<T>(response);
}

export const api = {
  auth: {
    signup: (input: { email: string; fullName: string; password: string; referralCode?: string }) =>
      apiFetch<{ message: string; verificationTokenPreview?: string | null }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    login: (input: { email: string; password: string }) =>
      apiFetch<{ message: string; user: unknown }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    logout: () =>
      apiFetch<{ message: string }>("/auth/logout", {
        method: "POST"
      }),
    me: () => apiFetch<{ user: unknown }>("/auth/me"),
    forgotPassword: (input: { email: string }) =>
      apiFetch<{ message: string; resetTokenPreview?: string | null }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    resetPassword: (input: { token: string; password: string }) =>
      apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    verifyEmail: (input: { token: string }) =>
      apiFetch<{ message: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    resendVerification: (input: { email: string }) =>
      apiFetch<{ message: string; verificationTokenPreview?: string | null }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify(input)
      })
  },
  onboarding: {
    state: () => apiFetch<{ state: unknown }>("/onboarding/state"),
    complete: (input: { userType: string; useCase: string; region: string }) =>
      apiFetch<{
        message: string;
        state: {
          onboardingCompleted: boolean;
          onboardingUserType: string | null;
          onboardingUseCase: string | null;
          onboardingRegion: string | null;
        };
      }>("/onboarding/complete", {
        method: "POST",
        body: JSON.stringify(input)
      })
  },
  dashboard: {
    overview: () => apiFetch<unknown>("/dashboard/overview")
  },
  marketplace: {
    list: (query: URLSearchParams) => apiFetch<unknown>(`/marketplace?${query.toString()}`),
    detail: (id: string) => apiFetch<unknown>(`/marketplace/${id}`),
    estimate: (id: string, input: { hours: number; quantity: number; storageGb?: number }) =>
      apiFetch<unknown>(`/marketplace/${id}/estimate`, {
        method: "POST",
        body: JSON.stringify(input)
      })
  },
  instances: {
    deploy: (input: {
      marketplaceItemId: string;
      name: string;
      region: string;
      image: string;
      sshKeyId?: string;
    }) =>
      apiFetch<{ message: string; instance: unknown }>("/instances/deploy", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    list: () => apiFetch<{ instances: unknown[] }>("/instances"),
    detail: (id: string) => apiFetch<{ instance: unknown }>(`/instances/${id}`),
    metrics: (id: string) => apiFetch<unknown>(`/instances/${id}/metrics`),
    logs: (id: string) => apiFetch<{ logs: unknown[] }>(`/instances/${id}/logs`),
    start: (id: string) => apiFetch<{ message: string; instance: unknown }>(`/instances/${id}/start`, { method: "POST" }),
    stop: (id: string) => apiFetch<{ message: string; instance: unknown }>(`/instances/${id}/stop`, { method: "POST" }),
    restart: (id: string) => apiFetch<{ message: string; instance: unknown }>(`/instances/${id}/restart`, { method: "POST" }),
    terminate: (id: string) =>
      apiFetch<{ message: string; instance: unknown }>(`/instances/${id}/terminate`, { method: "POST" })
  },
  sshKeys: {
    list: () => apiFetch<{ keys: unknown[] }>("/ssh-keys"),
    add: (input: { name: string; publicKey: string }) =>
      apiFetch<{ message: string; key: unknown }>("/ssh-keys", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    rename: (id: string, input: { name: string }) =>
      apiFetch<{ message: string; key: unknown }>(`/ssh-keys/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    remove: (id: string) => apiFetch<{ message: string }>(`/ssh-keys/${id}`, { method: "DELETE" })
  },
  billing: {
    overview: () => apiFetch<unknown>("/billing/overview"),
    usage: (groupBy: "instance" | "gpu" | "region") => apiFetch<unknown>(`/billing/usage?groupBy=${groupBy}`),
    credits: () => apiFetch<{ balance: number; recentTopUps: unknown[] }>("/billing/credits"),
    createCreditsCheckout: (input: { amountUsd: number }) =>
      apiFetch<{ topUpId: string; checkoutUrl: string }>("/billing/credits/checkout", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    addPaymentMethod: (input: {
      type: "CARD" | "BANK";
      provider: string;
      brand: string;
      number: string;
      expMonth: number;
      expYear: number;
      isDefault?: boolean;
    }) =>
      apiFetch<{ message: string }>("/billing/payment-methods", {
        method: "POST",
        body: JSON.stringify(input)
      })
  },
  referrals: {
    overview: () => apiFetch<unknown>("/referrals")
  },
  quotes: {
    list: () => apiFetch<{ quotes: unknown[] }>("/quotes"),
    create: (input: {
      gpuType: string;
      quantity: number;
      durationHours: number;
      region: string;
      notes?: string;
    }) =>
      apiFetch<{ message: string; quote: unknown }>("/quotes", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    updateStatus: (id: string, input: { status: "PENDING" | "APPROVED" | "REJECTED"; reviewNotes?: string }) =>
      apiFetch<{ message: string; quote: unknown }>(`/quotes/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(input)
      })
  },
  settings: {
    profile: () => apiFetch<unknown>("/settings"),
    updateProfile: (input: {
      fullName: string;
      preferredRegion?: string;
      notificationBilling?: boolean;
      notificationProduct?: boolean;
    }) =>
      apiFetch<{ message: string; profile: unknown }>("/settings/profile", {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    changePassword: (input: { currentPassword: string; newPassword: string }) =>
      apiFetch<{ message: string }>("/settings/security/change-password", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    createApiKey: (input: { name: string; expiresAt?: string }) =>
      apiFetch<{ message: string; rawKey: string; apiKey: unknown }>("/settings/api-keys", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    revokeApiKey: (id: string) => apiFetch<{ message: string }>(`/settings/api-keys/${id}`, { method: "DELETE" })
  },
  docs: {
    list: () => apiFetch<{ docs: unknown[] }>("/docs"),
    search: (q: string) => apiFetch<{ docs: unknown[] }>(`/docs/search?q=${encodeURIComponent(q)}`),
    get: (slug: string) => apiFetch<{ doc: unknown }>(`/docs/${slug}`)
  }
};
