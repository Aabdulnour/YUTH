"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppPageHeader, AppShell } from "@/components/layout/AppShell";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import { loadPersistedUserProfile } from "@/lib/persistence/profile-store";
import {
  HUB_CATEGORY_ICONS,
  HUB_CATEGORY_LABELS,
  HUB_ITEMS,
  getPersonalizedHubItems,
  type HubCategory,
  type HubItem,
} from "@/data/hub";
import type { UserProfile } from "@/types/profile";

const ALL_CATEGORIES = Object.keys(HUB_CATEGORY_LABELS) as HubCategory[];

export default function HubPage() {
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HubCategory | "all">("all");

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    let isCancelled = false;

    const loadProfile = async () => {
      const p = await loadPersistedUserProfile(userId);
      if (!isCancelled) {
        setProfile(p);
      }
    };

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isLoading, userId]);

  const personalizedItems = useMemo(() => {
    return getPersonalizedHubItems(HUB_ITEMS, profile);
  }, [profile]);

  const featuredItems = useMemo(() => {
    return personalizedItems.filter((item) => item.featured).slice(0, 3);
  }, [personalizedItems]);

  const filteredItems = useMemo(() => {
    const nonFeatured = personalizedItems.filter((item) => !featuredItems.includes(item));
    if (selectedCategory === "all") {
      return nonFeatured;
    }

    return nonFeatured.filter((item) => item.category === selectedCategory);
  }, [personalizedItems, featuredItems, selectedCategory]);

  if (isLoading) {
    return (
      <AppShell activePath="/hub">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-[#5f5953]">
          Loading resources...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/hub">
      <AppPageHeader
        eyebrow="Hub"
        title="Resources & opportunities"
      />

      {/* ── Featured (compact horizontal) ── */}
      {featuredItems.length > 0 && (
        <section className="mb-6">
          <div className="grid gap-3 md:grid-cols-3">
            {featuredItems.map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* ── Category filters ── */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] transition ${
            selectedCategory === "all"
              ? "bg-[#c82233] text-white"
              : "border border-[#e2dbd4] bg-white text-[#5f5953] hover:border-[#d0c9c1]"
          }`}
        >
          All
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              selectedCategory === cat
                ? "bg-[#c82233] text-white"
                : "border border-[#e2dbd4] bg-white text-[#5f5953] hover:border-[#d0c9c1]"
            }`}
          >
            {HUB_CATEGORY_ICONS[cat]} {HUB_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* ── Resource type legend ── */}
      <div className="mb-4 flex gap-4 text-xs text-[#9a7b72]">
        <span>📖 Informational</span>
        <span>🔗 Apply / Sign up</span>
      </div>

      {/* ── Grid ── */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-center text-sm text-[#5f5953]">
          No resources in this category.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <HubCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* ── Partner note ── */}
      <p className="mt-8 text-center text-xs text-[#9a7b72]">
        YUTH curates resources to help Canadian young adults. We may earn a referral fee from some partners, which helps keep YUTH free.
      </p>
    </AppShell>
  );
}

/* ── Featured card (compact) ── */

function FeaturedCard({ item }: { item: HubItem }) {
  const isExternal = item.ctaUrl.startsWith("http");

  return (
    <div className="flex flex-col rounded-xl border border-[#e2dbd4] bg-gradient-to-br from-[#faf8f6] to-white p-4 shadow-[0_2px_12px_rgba(20,15,12,0.04)] transition hover:shadow-[0_4px_16px_rgba(20,15,12,0.08)]">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-[#fff1f2] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#c82233]">
          Featured
        </span>
        <span className="text-xs text-[#9a7b72]">{HUB_CATEGORY_ICONS[item.category]} {HUB_CATEGORY_LABELS[item.category]}</span>
      </div>
      <p className="text-sm font-bold text-[#151311]">{item.title}</p>
      <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-[#5f5953]">{item.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-[#9a7b72]">{item.provider}</span>
        {isExternal ? (
          <a
            href={item.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#c82233] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#a01c2a]"
          >
            {item.ctaLabel}
          </a>
        ) : (
          <Link
            href={item.ctaUrl}
            className="rounded-lg bg-[#c82233] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#a01c2a]"
          >
            {item.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Standard hub card ── */

function HubCard({ item }: { item: HubItem }) {
  const isExternal = item.ctaUrl.startsWith("http");
  const isApplication = isExternal;

  return (
    <article className="flex flex-col rounded-xl border border-[#e2dbd4] bg-white p-4 transition hover:shadow-[0_4px_12px_rgba(20,15,12,0.06)]">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-[#9a7b72]">{isApplication ? "🔗" : "📖"}</span>
        <span className="text-xs text-[#9a7b72]">{HUB_CATEGORY_ICONS[item.category]} {HUB_CATEGORY_LABELS[item.category]}</span>
      </div>
      <h3 className="text-sm font-bold text-[#151311]">{item.title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-[#5f5953]">{item.description}</p>
      <p className="mt-2 text-xs italic text-[#9a7b72]">{item.whyItMatters}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-[#9a7b72]">{item.provider}</span>
        {isExternal ? (
          <a
            href={item.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[#e2dbd4] bg-[#faf8f6] px-3 py-1 text-xs font-medium text-[#151311] transition hover:border-[#d0c9c1]"
          >
            {item.ctaLabel}
          </a>
        ) : (
          <Link
            href={item.ctaUrl}
            className="rounded-lg border border-[#e2dbd4] bg-[#faf8f6] px-3 py-1 text-xs font-medium text-[#151311] transition hover:border-[#d0c9c1]"
          >
            {item.ctaLabel}
          </Link>
        )}
      </div>
    </article>
  );
}
