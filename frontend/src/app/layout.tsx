import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "../components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mintair Cloud",
  description: "Cloud infrastructure and GPU marketplace platform"
};

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem("mintair-theme");
    const fromSystem = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const theme = stored === "light" || stored === "dark" ? stored : fromSystem;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-brand-white text-ink-900">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">
            <Providers>{children}</Providers>
          </div>

          <footer className="border-t border-brand-gray bg-brand-white px-4 py-4 sm:px-6">
            <div className="mx-auto flex w-full max-w-[1380px] flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-500">Mintair Cloud</p>
              <nav className="flex flex-wrap items-center gap-4 text-sm text-ink-600">
                <Link href="/privacy-policy" className="hover:text-brand-blue hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-service" className="hover:text-brand-blue hover:underline">
                  Terms of Service
                </Link>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
