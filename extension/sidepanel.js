const EXTENSION_CONFIG = globalThis.MAPLEMIND_EXTENSION_CONFIG ?? {
  dashboardUrl: "https://yuthcanada.com/dashboard",
};

const RECOMMENDATION_COPY = {
  buy_now: {
    label: "On Track",
    tone: "good",
    coachingLine: "This purchase fits your current MapleMind budget plan.",
  },
  wait: {
    label: "Pause for Now",
    tone: "watch",
    coachingLine: "Upcoming deadlines are close, so waiting protects cash flow.",
  },
  find_cheaper_option: {
    label: "Look for a Cheaper Option",
    tone: "watch",
    coachingLine: "Overall budget may fit, but this category is close to its limit.",
  },
  save_for_later: {
    label: "Save for Later",
    tone: "bad",
    coachingLine: "This purchase would likely push spending over your monthly plan.",
  },
  review_budget: {
    label: "Review Budget First",
    tone: "neutral",
    coachingLine: "Finish your budget setup so MapleMind can personalize this decision.",
  },
};

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

function toTitleCase(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMerchant(merchant = "") {
  const normalized = merchant.toLowerCase();

  if (normalized === "bestbuy") {
    return "Best Buy";
  }

  return normalized ? toTitleCase(normalized) : "Unknown";
}

function formatCategory(category = "") {
  if (!category) {
    return "General";
  }

  const spaced = category
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");

  return toTitleCase(spaced);
}

function formatRisk(risk = "none") {
  const value = risk.toLowerCase();

  if (value === "high") return "High";
  if (value === "watch") return "Watch";
  return "Low";
}

function formatProfileSource(source = "demo_profile") {
  if (source === "authenticated_user_profile") {
    return "Your MapleMind profile";
  }

  return "MapleMind demo profile";
}

function mapLegacyRecommendation(recommendation = "") {
  const value = recommendation.toLowerCase();

  if (value.includes("fit") || value.includes("buy") || value.includes("safe")) {
    return "buy_now";
  }

  if (value.includes("watch") || value.includes("consider")) {
    return "wait";
  }

  if (value.includes("over") || value.includes("avoid") || value.includes("risky")) {
    return "save_for_later";
  }

  return "review_budget";
}

function normalizeStoredAnalysis(storedValue) {
  if (!storedValue) {
    return null;
  }

  if (storedValue.analysis) {
    return storedValue;
  }

  return {
    analyzedAt: new Date().toISOString(),
    page: {
      title: storedValue.title,
      merchant: storedValue.merchant,
      pageType: "product",
      url: null,
    },
    analysis: {
      fitsBudget: Boolean(storedValue.fitsBudget),
      confidence: "medium",
      detectedCategory: storedValue.category ?? "general",
      purchaseAmount: Number(storedValue.price ?? 0),
      projectedCategorySpend: Number(storedValue.projectedCategorySpend ?? 0),
      categoryCap: Number(storedValue.categoryBudget ?? 0),
      projectedDiscretionarySpend: Number(storedValue.projectedDiscretionarySpend ?? 0),
      discretionaryBudget: Number(storedValue.discretionaryBudget ?? 0),
      deadlineRisk: storedValue.deadlineRisk ?? "none",
      goalImpact: "neutral",
      matchedDeadlines: [],
      matchedGoals: Array.isArray(storedValue.matchedGoals) ? storedValue.matchedGoals : [],
      recommendation: mapLegacyRecommendation(storedValue.recommendation),
      explanation: Array.isArray(storedValue.reasons)
        ? storedValue.reasons.join(" ")
        : "",
      tags: Array.isArray(storedValue.tags) ? storedValue.tags : [],
    },
    metadata: {
      profileSource: "demo_profile",
      mode: "preview",
      note: "Preview mode: MapleMind is using a demo spending profile for extension analysis.",
    },
  };
}

function getRecommendationCopy(code) {
  return (
    RECOMMENDATION_COPY[code] ?? {
      label: "Review Needed",
      tone: "neutral",
      coachingLine: "MapleMind has limited context for this page.",
    }
  );
}

function buildSummary(analysis, recommendationCopy) {
  const remainingBudget =
    Number(analysis.discretionaryBudget ?? 0) -
    Number(analysis.projectedDiscretionarySpend ?? 0);

  const budgetLine = Number.isFinite(remainingBudget)
    ? `Estimated room after purchase: ${formatCurrency(remainingBudget)}.`
    : "";

  return `${recommendationCopy.coachingLine} ${budgetLine}`.trim();
}

function showOnly(sectionId) {
  ["loadingState", "errorState", "emptyState", "analysisContent"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = id === sectionId ? "" : "none";
    }
  });
}

function setText(id, value, fallback = "-") {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }

  el.textContent = value ?? fallback;
}

function renderTagList(id, values, emptyMessage) {
  const container = document.getElementById(id);
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!Array.isArray(values) || values.length === 0) {
    const empty = document.createElement("span");
    empty.className = "muted";
    empty.textContent = emptyMessage;
    container.appendChild(empty);
    return;
  }

  values.forEach((value) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = toTitleCase(String(value));
    container.appendChild(tag);
  });
}

function renderReasonList(points) {
  const container = document.getElementById("reasons");
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!points.length) {
    const text = document.createElement("p");
    text.textContent = "No additional reasoning provided.";
    container.appendChild(text);
    return;
  }

  const list = document.createElement("ul");
  points.forEach((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    list.appendChild(item);
  });

  container.appendChild(list);
}

function renderLoading() {
  showOnly("loadingState");
}

function renderError(message) {
  showOnly("errorState");
  setText("errorMessage", message || "Something went wrong while analyzing this page.");
}

function renderEmpty(message) {
  showOnly("emptyState");
  setText("emptyStateMessage", message || "Open a supported product page to see MapleMind guidance.");
}

function renderAnalysis(storedValue) {
  const normalized = normalizeStoredAnalysis(storedValue);
  if (!normalized || !normalized.analysis) {
    renderEmpty("Open a supported product page to see MapleMind guidance.");
    return;
  }

  showOnly("analysisContent");

  const analysis = normalized.analysis;
  const page = normalized.page ?? {};
  const recommendationCode = analysis.recommendation ?? "review_budget";
  const recommendationCopy = getRecommendationCopy(recommendationCode);

  const recommendationEl = document.getElementById("recommendation");
  if (recommendationEl) {
    recommendationEl.textContent = recommendationCopy.label;
    recommendationEl.dataset.tone = recommendationCopy.tone;
  }

  const remainingBudget =
    Number(analysis.discretionaryBudget ?? 0) -
    Number(analysis.projectedDiscretionarySpend ?? 0);

  setText("summary", buildSummary(analysis, recommendationCopy), "No summary available.");
  setText("productTitle", page.title ?? "Current product", "Current product");
  setText("merchant", formatMerchant(page.merchant), "Unknown");
  setText("price", formatCurrency(analysis.purchaseAmount), "$0.00");
  setText("category", formatCategory(analysis.detectedCategory), "General");
  setText("projectedSpend", formatCurrency(analysis.projectedDiscretionarySpend), "$0.00");
  setText("budgetCap", formatCurrency(analysis.discretionaryBudget), "$0.00");
  setText("remainingBudget", formatCurrency(remainingBudget), "$0.00");
  setText("budgetFit", analysis.fitsBudget ? "Within monthly plan" : "Over monthly plan");
  setText("deadlineRisk", formatRisk(analysis.deadlineRisk), "Low");

  const deadlineCount = Array.isArray(analysis.matchedDeadlines)
    ? analysis.matchedDeadlines.length
    : 0;

  setText(
    "upcomingDeadlines",
    deadlineCount > 0
      ? `${deadlineCount} payment deadline${deadlineCount > 1 ? "s" : ""}`
      : "No urgent deadlines"
  );

  setText("profileSource", formatProfileSource(normalized.metadata?.profileSource), "Demo profile");
  setText("analysisMode", normalized.metadata?.mode === "live" ? "Live" : "Preview", "Preview");
  setText(
    "contextNote",
    normalized.metadata?.note ||
      "Preview mode: MapleMind uses a demo spending profile while extension auth sync is in progress."
  );

  renderTagList("matchedGoals", analysis.matchedGoals, "No matched goals");

  const reasonPoints = [
    recommendationCopy.coachingLine,
    analysis.explanation,
    Array.isArray(analysis.matchedDeadlines) && analysis.matchedDeadlines.length
      ? `Deadlines considered: ${analysis.matchedDeadlines.join(", ")}.`
      : null,
    Array.isArray(analysis.matchedGoals) && analysis.matchedGoals.length
      ? `Goals considered: ${analysis.matchedGoals.join(", ")}.`
      : null,
  ].filter(Boolean);

  renderReasonList(reasonPoints);
}

async function loadAnalysis() {
  try {
    const stored = await chrome.storage.local.get([
      "lastAnalysis",
      "lastAnalysisError",
      "lastAnalysisLoading",
      "lastAnalysisIdle",
      "lastAnalysisIdleMessage",
    ]);

    if (stored.lastAnalysisLoading) {
      renderLoading();
      return;
    }

    if (stored.lastAnalysisError) {
      renderError(stored.lastAnalysisError);
      return;
    }

    if (stored.lastAnalysisIdle) {
      renderEmpty(stored.lastAnalysisIdleMessage);
      return;
    }

    if (!stored.lastAnalysis) {
      renderEmpty("Open a supported product page to see MapleMind guidance.");
      return;
    }

    renderAnalysis(stored.lastAnalysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load side panel data.";
    renderError(message);
  }
}

function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (
      changes.lastAnalysis ||
      changes.lastAnalysisError ||
      changes.lastAnalysisLoading ||
      changes.lastAnalysisIdle ||
      changes.lastAnalysisIdleMessage
    ) {
      void loadAnalysis();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const openDashboardBtn = document.getElementById("openDashboardBtn");
  if (openDashboardBtn) {
    openDashboardBtn.addEventListener("click", () => {
      chrome.tabs.create({
        url: EXTENSION_CONFIG.dashboardUrl ?? "https://yuthcanada.com/dashboard",
      });
    });
  }

  setupStorageListener();
  void loadAnalysis();
});
