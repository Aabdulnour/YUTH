"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AppShellProps {
  activePath: "/dashboard" | "/ask-ai" | "/profile";
  children: ReactNode;
  maxWidthClassName?: string;
}

interface AppPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ask-ai", label: "Ask AI" },
  { href: "/profile", label: "Profile" },
] as const;

function joinClasses(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function AppShell({ activePath, children, maxWidthClassName = "max-w-6xl" }: AppShellProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      setIsLoggingOut(false);
      router.replace("/auth?mode=login");
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#faf8f6,_#f5f2ee_48%,_#f3efe9_100%)] text-[#151311]">
      <div className={joinClasses("mx-auto px-6 py-8", maxWidthClassName)}>
        <header className="sticky top-4 z-20 mb-8 rounded-2xl border border-[#e2dbd4] bg-white/92 px-4 py-3 shadow-[0_10px_30px_rgba(20,15,12,0.07)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm font-bold tracking-[0.18em] text-[#151311]">
                MAPLEMIND
              </Link>
              <span className="rounded-full bg-[#fff1f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#c82233]">
                Preview
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex flex-wrap items-center gap-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = item.href === activePath;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={joinClasses(
                        "rounded-xl px-4 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-[#c82233] text-white"
                          : "border border-[#e2dbd4] bg-[#faf8f6] text-[#4d473f] hover:border-[#d0c9c1]"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                disabled={isLoggingOut}
                className="rounded-xl border border-[#e2dbd4] bg-[#faf8f6] px-3 py-2 text-xs font-medium text-[#5f5953] transition hover:border-[#d0c9c1] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function AppPageHeader({ eyebrow, title, description, actions }: AppPageHeaderProps) {
  return (
    <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight md:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-lg text-[#6f6a64]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </section>
  );
}
