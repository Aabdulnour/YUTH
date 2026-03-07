const DASHBOARD_URL = "http://localhost:3000/dashboard";

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(amount);
}

function getStatusTone(recommendation) {
  switch ((recommendation || "").toLowerCase()) {
    case "fits":
    case "buy":
    case "safe":
      return "good";
    case "watch":
    case "consider":
      return "watch";
    case "over limit":
    case "avoid":
    case "risky":
      return "bad";
    default:
      return "neutral";
  }
}

function getShortSummary(data) {
  const parts = [];

  if (data.fitsBudget) {
    parts.push(
      `This purchase currently fits the monthly budget with ${formatCurrency(
        data.remainingAfterPurchase
      )} left`
    );
  } else {
    parts.push("This purchase may push you over your monthly budget");
  }

  if (data.deadlineRisk === "high") {
    parts.push("as you have a high deadline risk coming up");
  } else if (data.deadlineRisk === "watch") {
    parts.push("you may want to watch out for your upcoming deadlines");
  }

  if (Array.isArray(data.matchedGoals) && data.matchedGoals.length > 0) {
    parts.push(`relating to ${data.matchedGoals[0]}.`);
  }

  return parts.join(", ");
}

function showOnly(sectionId) {
  ["loadingState", "errorState", "emptyState", "analysisContent"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === sectionId ? "" : "none";
  });
}

function setText(id, value, fallback = "—") {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? fallback;
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
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
  setText("emptyStateMessage", message || "Open a supported product page to see analysis.");
}

function renderAnalysis(data) {
  showOnly("analysisContent");

  const recommendation = data.recommendation || "Unknown";
  const tone = getStatusTone(recommendation);

  const recommendationEl = document.getElementById("recommendation");
  if (recommendationEl) {
    recommendationEl.textContent = recommendation;
    recommendationEl.dataset.tone = tone;
  }

  setText("summary", getShortSummary(data), "No summary available");
  setText("price", formatCurrency(data.price));
  setText(
  "category",
  data.category
    ? data.category.charAt(0).toUpperCase() + data.category.slice(1)
    : "General"
);
  setText("projectedSpend", formatCurrency(data.projectedDiscretionarySpend));
  setText("budgetCap", formatCurrency(data.discretionaryBudget));
  setText("remainingBudget", formatCurrency(data.remainingAfterPurchase));

  setText(
    "budgetFit",
    data.fitsBudget ? "Fits monthly budget" : "Exceeds monthly budget"
  );

  setText(
    "deadlineRisk",
    data.deadlineRisk
      ? data.deadlineRisk.charAt(0).toUpperCase() + data.deadlineRisk.slice(1)
      : "None"
  );

 const goals =
  Array.isArray(data.matchedGoals) && data.matchedGoals.length
    ? data.matchedGoals
        .map((goal) =>
          `<span class="tag">${goal.charAt(0).toUpperCase() + goal.slice(1)}</span>`
        )
        .join("")
    : '<span class="muted">No matched goals</span>';

  setHTML("matchedGoals", goals);

  const reasons =
    Array.isArray(data.reasons) && data.reasons.length
      ? `<ul>${data.reasons.map((reason) => `<li>${reason}</li>`).join("")}</ul>`
      : "<p>No additional reasoning provided.</p>";

  setHTML("reasons", reasons);
}

async function loadAnalysis() {
  try {
    const stored = await chrome.storage.local.get([
      "lastAnalysis",
      "lastAnalysisError",
      "lastAnalysisLoading",
      "lastAnalysisIdle",
      "lastAnalysisIdleMessage"
    ]);

    if (stored.lastAnalysisLoading) {
      renderLoading();
      return;
    }

    if (stored.lastAnalysisError) {
      renderError(stored.lastAnalysisError);
      return;
    }

    if (!stored.lastAnalysis) {
      renderEmpty("Open a supported product page to see analysis.");
      return;
    }

    renderAnalysis(stored.lastAnalysis);
  } catch (error) {
    renderError(error?.message || "Failed to load side panel data.");
  }
}

function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;

    if (
      changes.lastAnalysis ||
      changes.lastAnalysisError ||
      changes.lastAnalysisLoading
    ) {
      loadAnalysis();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const openDashboardBtn = document.getElementById("openDashboardBtn");
  if (openDashboardBtn) {
    openDashboardBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: DASHBOARD_URL });
    });
  }

  setupStorageListener();
  loadAnalysis();
});