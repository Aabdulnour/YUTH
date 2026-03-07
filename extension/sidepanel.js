const DASHBOARD_URL = "http://localhost:3000/dashboard";

function formatCurrency(value) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(value);
}

function titleCase(value) {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getShortSummary(data) {
  const parts = [];

  if (data.fitsBudget) {
    parts.push("Fits your current monthly budget");
  } else {
    parts.push("May push you over your monthly budget");
  }

  if (data.deadlineRisk === "high") {
    parts.push("high deadline risk");
  } else if (data.deadlineRisk === "watch") {
    parts.push("upcoming deadlines to watch");
  }

  if (data.matchedGoals?.length) {
    parts.push(`related to ${data.matchedGoals[0]}`);
  }

  return parts.join(" • ");
}

function renderEmpty() {
  document.getElementById("statusBadge").textContent = "No Data";
  document.getElementById("purchaseAmount").textContent = "—";
  document.getElementById("budgetFit").textContent = "—";
  document.getElementById("deadlineRisk").textContent = "—";
  document.getElementById("category").textContent = "—";
  document.getElementById("recommendation").textContent = "—";
  document.getElementById("summaryText").textContent =
    "Visit a supported shopping page to analyze a purchase.";
}

function renderResult(data) {
  document.getElementById("statusBadge").textContent = data.fitsBudget
    ? "On Track"
    : "Needs Review";

  document.getElementById("purchaseAmount").textContent =
    formatCurrency(data.purchaseAmount);

  document.getElementById("budgetFit").textContent = data.fitsBudget
    ? "Fits"
    : "Over Limit";

  document.getElementById("deadlineRisk").textContent =
    titleCase(data.deadlineRisk);

  document.getElementById("category").textContent =
    titleCase(data.detectedCategory);

  document.getElementById("recommendation").textContent =
    titleCase(data.recommendation);

  document.getElementById("summaryText").textContent =
    getShortSummary(data);
}

async function loadAnalysis() {
  const stored = await chrome.storage.local.get(["lastAnalysis"]);

  if (!stored.lastAnalysis) {
    renderEmpty();
    return;
  }

  renderResult(stored.lastAnalysis);
}

//testing

document.addEventListener("DOMContentLoaded", () => {
  loadAnalysis();
});

// document.addEventListener("DOMContentLoaded", () => {
//   const button = document.getElementById("openDashboardBtn");

//   button.addEventListener("click", () => {
//     chrome.tabs.create({ url: DASHBOARD_URL });
//   });

//   loadAnalysis();
// });

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.lastAnalysis) {
    loadAnalysis();
  }
});