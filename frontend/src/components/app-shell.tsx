"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  Boxes,
  ChevronRight,
  CircleDollarSign,
  Cpu,
  FileCode2,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  UserPlus,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import type { CreditsSummary } from "../lib/types";
import { Button } from "./ui/button";
import { useSession } from "./session-provider";
import { Input } from "./ui/input";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "What matters right now" },
  { href: "/marketplace", label: "Marketplace", icon: Cpu, description: "Discover and deploy compute" },
  { href: "/instances", label: "Instances", icon: Boxes, description: "Lifecycle, metrics, and control" },
  { href: "/ssh-keys", label: "SSH Keys", icon: KeyRound, description: "Secure access credentials" },
  { href: "/billing", label: "Billing", icon: CircleDollarSign, description: "Spend, invoices, and balance" },
  { href: "/referrals", label: "Referrals", icon: UserPlus, description: "Growth and reward tracking" },
  { href: "/quotations", label: "Quotations", icon: ScrollText, description: "Reserved and custom pricing" },
  { href: "/docs", label: "Docs", icon: FileCode2, description: "Guides and implementation notes" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Account, security, automation" }
];

function formatSegment(segment: string): string {
  if (/^[a-z0-9]{10,}$/i.test(segment)) {
    return "Detail";
  }

  return segment
    .split("-")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshSession } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [routeDirection, setRouteDirection] = useState<"forward" | "back">("forward");
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("25");
  const creditsPanelRef = useRef<HTMLDivElement | null>(null);

  const creditsQuery = useQuery({
    queryKey: ["credits-summary"],
    queryFn: () => api.billing.credits() as Promise<CreditsSummary>,
    enabled: Boolean(user)
  });

  const checkoutMutation = useMutation({
    mutationFn: (amountUsd: number) => api.billing.createCreditsCheckout({ amountUsd }),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not start payment.";
      toast.error(message);
    }
  });

  const activeNav = useMemo(() => navItems.find((item) => pathname.startsWith(item.href)), [pathname]);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: Array<{ label: string; href: string }> = [{ label: "Console", href: "/dashboard" }];

    let route = "";
    for (const segment of segments) {
      route += `/${segment}`;
      crumbs.push({
        label: formatSegment(segment),
        href: route
      });
    }

    return crumbs;
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = "mintair-route-stack";
    const raw = window.sessionStorage.getItem(storageKey);
    let stack: string[] = [];

    try {
      stack = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      stack = [];
    }

    if (!stack.length) {
      stack.push(pathname);
      setRouteDirection("forward");
      window.sessionStorage.setItem(storageKey, JSON.stringify(stack));
      return;
    }

    const last = stack[stack.length - 1];
    if (last === pathname) {
      return;
    }

    const existingIndex = stack.lastIndexOf(pathname);
    if (existingIndex >= 0) {
      setRouteDirection("back");
      stack = stack.slice(0, existingIndex + 1);
    } else {
      setRouteDirection("forward");
      stack.push(pathname);
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(stack.slice(-28)));
  }, [pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
    setCreditsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!creditsOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (creditsPanelRef.current?.contains(event.target as Node)) {
        return;
      }
      setCreditsOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [creditsOpen]);

  const onLogout = async () => {
    try {
      setLoggingOut(true);
      await api.auth.logout();
      await refreshSession();
      router.replace("/login");
      toast.success("Logged out.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to logout right now.";
      toast.error(message);
    } finally {
      setLoggingOut(false);
      setMobileNavOpen(false);
    }
  };

  const onCreateTopUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountUsd = Number(topUpAmount);
    if (!Number.isFinite(amountUsd) || amountUsd < 1) {
      toast.error("Enter an amount of at least $1.");
      return;
    }

    checkoutMutation.mutate(amountUsd);
  };

  const availableCredits = Number(creditsQuery.data?.balance ?? user?.creditBalance ?? 0);

  return (
    <div className="min-h-screen px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1380px] flex-col border border-brand-gray bg-white lg:flex-row">
        <div
          className={clsx(
            "fixed inset-0 z-40 bg-brand-charcoal/45 transition-opacity duration-200 lg:hidden",
            mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setMobileNavOpen(false)}
        />

        <aside
          className={clsx(
            "surface-card border-ink-300 p-3 lg:min-h-full lg:w-[244px]",
            "fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[330px] -translate-x-full overflow-y-auto transition-transform duration-200 lg:static lg:z-auto lg:w-[244px] lg:max-w-none lg:translate-x-0",
            mobileNavOpen && "translate-x-0"
          )}
        >
          <div className="mb-5 flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center bg-brand-charcoal text-xs font-medium text-brand-lime">
                MC
              </span>
              <span className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink-900">Mintair Cloud</span>
            </Link>

            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => router.push("/docs")} aria-label="Open docs">
                <LifeBuoy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="lg:hidden"
                onClick={() => setCreditsOpen((open) => !open)}
                aria-label="Open credits"
              >
                <CircleDollarSign className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={clsx(
                    "group flex items-center justify-between border px-2.5 py-2 text-sm transition-all duration-150",
                    active
                      ? "border-brand-charcoal bg-brand-charcoal text-white"
                      : "border-transparent text-ink-600 hover:border-brand-gray hover:bg-white hover:text-ink-900"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-mono text-[12px] uppercase tracking-[0.08em]">{item.label}</span>
                  </span>
                  <ChevronRight
                    className={clsx(
                      "h-4 w-4 transition-all duration-150",
                      active
                        ? "translate-x-0 text-brand-lime opacity-100"
                        : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border border-brand-gray bg-white p-3">
            <p className="eyebrow text-ink-500">Signed in</p>
            <p className="mt-1 truncate text-sm font-medium text-ink-800">{user?.email}</p>
            <Button
              className="mt-3 w-full"
              size="sm"
              variant="secondary"
              onClick={onLogout}
              loading={loggingOut}
              loadingLabel="Signing out"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1 px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3 lg:px-6 lg:py-5">
          <div className="surface-card mb-3 border-ink-300 px-3 py-3 lg:hidden">
            <div className="flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-9 px-3"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileNavOpen}
              >
                <Menu className="h-4 w-4" />
                Menu
              </Button>

              <Link href="/dashboard" className="inline-flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center bg-brand-charcoal text-xs font-medium text-brand-lime">
                  MC
                </span>
                <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-900">Mintair Cloud</span>
              </Link>

              <Button size="sm" variant="ghost" onClick={() => router.push("/docs")} aria-label="Open docs">
                <LifeBuoy className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCreditsOpen((open) => !open)} aria-label="Open credits">
                <CircleDollarSign className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <header className="surface-card mb-4 border-ink-300 px-4 py-4 sm:px-5 lg:mb-5">
            <nav key={pathname} className="crumb-enter flex items-center gap-1 text-xs text-ink-500">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.href} className="inline-flex items-center gap-1">
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-700">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="font-mono text-[12px] uppercase tracking-[0.08em] transition-colors hover:text-brand-blue">
                      {crumb.label}
                    </Link>
                  )}
                  {index < breadcrumbs.length - 1 ? <ChevronRight className="h-3 w-3 text-ink-400" /> : null}
                </span>
              ))}
            </nav>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-brand-blue">Workspace</p>
                <h1 className="mt-2 text-[1.6rem] leading-tight text-ink-900 sm:text-[1.8rem] lg:text-[1.95rem]">
                  {activeNav?.label ?? "Console"}
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  {activeNav?.description ?? "Deploy and manage infrastructure with calm, confident control."}
                </p>
              </div>
              <div ref={creditsPanelRef} className="relative ml-auto">
                <button
                  type="button"
                  onClick={() => setCreditsOpen((open) => !open)}
                  className="inline-flex items-center gap-2 border border-brand-gray bg-white px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-brand-charcoal transition-colors hover:border-brand-charcoal"
                >
                  <CircleDollarSign className="h-4 w-4" />
                  Credits {availableCredits.toFixed(2)}
                </button>

                {creditsOpen ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[285px] border border-brand-gray bg-white p-3 shadow-sm">
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-500">Credit Wallet</p>
                    <p className="mt-1 text-sm text-ink-700">Available: ${availableCredits.toFixed(2)}</p>

                    <form className="mt-3 space-y-2" onSubmit={onCreateTopUp}>
                      <Input
                        type="number"
                        min={1}
                        step="1"
                        value={topUpAmount}
                        onChange={(event) => setTopUpAmount(event.target.value)}
                        placeholder="Amount in USD"
                      />
                      <Button type="submit" className="w-full" loading={checkoutMutation.isPending} loadingLabel="Redirecting...">
                        Add Credits
                      </Button>
                    </form>

                    <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
                      You will be redirected to CopperX checkout to complete payment.
                    </p>

                    {creditsQuery.data?.recentTopUps?.length ? (
                      <div className="mt-3 space-y-1 border-t border-brand-gray pt-2">
                        {creditsQuery.data.recentTopUps.slice(0, 3).map((topUp) => (
                          <div key={topUp.id} className="flex items-center justify-between text-[11px] text-ink-600">
                            <span>${topUp.amountUsd.toFixed(2)}</span>
                            <span className="font-mono uppercase tracking-[0.08em]">{topUp.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div key={pathname} className={routeDirection === "back" ? "route-enter-back" : "route-enter-forward"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
