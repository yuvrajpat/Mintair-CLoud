"use client";

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
  ScrollText,
  Settings,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { useSession } from "./session-provider";

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
  const [routeDirection, setRouteDirection] = useState<"forward" | "back">("forward");

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
    }
  };

  return (
    <div className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1380px] flex-col border border-brand-gray bg-white p-2.5 lg:flex-row lg:p-3">
        <aside className="surface-card border-ink-300 p-3 lg:min-h-full lg:w-[244px]">
          <div className="mb-5 flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center bg-brand-charcoal text-xs font-medium text-brand-lime">
                MC
              </span>
              <span className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink-900">Mintair Cloud</span>
            </Link>
            <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => router.push("/docs")} aria-label="Open docs">
              <LifeBuoy className="h-4 w-4" />
            </Button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
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
            <Button className="mt-3 w-full" size="sm" variant="secondary" onClick={onLogout} loading={loggingOut} loadingLabel="Signing out">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1 px-1 pt-3 lg:px-6 lg:pt-0">
          <header className="surface-card mb-5 border-ink-300 px-5 py-4">
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

            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow text-brand-blue">Workspace</p>
                <h1 className="mt-2 text-[1.95rem] leading-tight text-ink-900">{activeNav?.label ?? "Console"}</h1>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  {activeNav?.description ?? "Deploy and manage infrastructure with calm, confident control."}
                </p>
              </div>
              <div className="hidden border border-brand-gray bg-white px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-brand-charcoal md:block">
                Live infrastructure workspace
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
