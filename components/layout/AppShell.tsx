"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface AppShellProps {
  activePath: "/dashboard" | "/ask-ai" | "/profile" | "/mindmap" | "/hub";
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
  { href: "/mindmap", label: "MindMap" },
  { href: "/hub", label: "Hub" },
  { href: "/ask-ai", label: "Ask AI" },
  { href: "/profile", label: "Profile" },
] as const;

function joinClasses(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function AppShell({ activePath, children, maxWidthClassName = "max-w-6xl" }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#f5f2ee] text-[#151311]">
      <div className={joinClasses("mx-auto px-6 py-6", maxWidthClassName)}>
        <header className="sticky top-0 z-20 -mx-6 mb-6 border-b border-[#e2dbd4]/60 bg-[#f5f2ee]/95 px-6 py-3 backdrop-blur-sm">
          <div className="mx-auto flex flex-wrap items-center justify-between gap-3" style={{ maxWidth: "inherit" }}>
            <Link href="/dashboard" className="text-sm font-bold tracking-[0.18em] text-[#151311] transition hover:text-[#c82233]">
              YUTH
            </Link>

            <nav className="flex flex-wrap items-center gap-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === activePath;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={joinClasses(
                      "rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
                      isActive
                        ? "bg-[#c82233] text-white shadow-sm"
                        : "text-[#5f5953] hover:bg-[#ece7e1] hover:text-[#151311]"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function AppPageHeader({ eyebrow, title, description, actions }: AppPageHeaderProps) {
  return (
    <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a7b72]">{eyebrow}</p>
        <h1 className="mt-1.5 text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-base text-[#6f6a64]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </section>
  );
}
