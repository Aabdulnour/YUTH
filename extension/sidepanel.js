const DASHBOARD_URL = "http://localhost:3000/dashboard";

function formatCurrency(value) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2
  }).format(value);
}

function titleCase(value) {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function setBadge(text, tone) {
  const badge = document.getElementById("statusBadge");
  badge.textContent = text;
  badge.classList.remove("is-positive", "is-warning", "is-danger");
  if (tone) badge.classList.add(tone);
}

function setMetricValue(id, text, tone) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.remove("is-positive", "is-warning", "is-danger");
  if (tone) el.classList.add(tone);
}

function renderTags(tags = []) {
  const wrap = document.getElementById("tags");
  wrap.innerHTML = "";

  if (!tags.length) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = "No signals yet";
    wrap.appendChild(tag);
    return;
  }

  tags.forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = titleCase(item);
    wrap.appendChild(tag);
  });
}

function renderDetailList(items) {
  const list = document.getElementById("detailList");
  list.innerHTML = "";

  items.forEach((text) => {
    const li = document.createElement("li");
    li.className = "detail-item";
    li.textContent = text;
    list.appendChild(li);
  });
}

function getBudgetLeft(data) {
  if (
    typeof data.discretionaryBudget !== "number" ||
    typeof data.projectedDiscretionarySpend !== "number"
  ) {
    return null;
  }

  return data.discretionaryBudget - data.projectedDiscretionarySpend;
}

function getBudgetDisplay(data) {
  const left = getBudgetLeft(data);

  if (left === null) {
    return { text: "—", tone: "" };
  }

  if (left >= 0) {
    return {
      text: `${formatCurrency(left)} left`,
      tone: "is-positive"
    };
  }

  return {
    text: `${formatCurrency(Math.abs(left))} over`,
    tone: "is-danger"
  };
}

function getDeadlineDisplay(data) {
  switch (data.deadlineRisk) {
    case "high":
      return { text: "High", tone: "is-danger" };
    case "watch":
      return { text: "Watch", tone: "is-warning" };
    case "none":
      return { text: "Clear", tone: "is-positive" };
    default:
      return { text: "—", tone: "" };
  }
}

function getSummaryText(data) {
  const parts = [];

  if (data.fitsBudget) {
    parts.push("This purchase fits your current monthly budget");
  } else {
    parts.push("This purchase may push you beyond your monthly plan");
  }

  if (data.deadlineRisk === "high") {
    parts.push("however, there is a high near-term deadline risk");
  } else if (data.deadlineRisk === "watch") {
    parts.push("and there are upcoming deadlines to watch");
  }

  return parts.join(", ");
}

function getDetailItems(data) {
  const items = [];

  items.push(
    `Projected category spend: ${formatCurrency(data.projectedCategorySpend)} of ${formatCurrency(data.categoryCap)}.`
  );

  items.push(
    `Projected discretionary spend: ${formatCurrency(data.projectedDiscretionarySpend)} of ${formatCurrency(data.discretionaryBudget)}.`
  );

  if (data.matchedDeadlines?.length) {
    items.push(`Upcoming deadlines: ${data.matchedDeadlines.join(", ")}.`);
  }

  if (data.matchedGoals?.length) {
    items.push(`Related goals: ${data.matchedGoals.join(", ")}.`);
  }

  items.push(`Recommended next step: ${titleCase(data.recommendation)}.`);

  return items;
}

function renderEmpty() {
  setBadge("No Data", "is-warning");
  document.getElementById("purchaseAmount").textContent = "—";
  setMetricValue("budgetFit", "—");
  setMetricValue("deadlineRisk", "—");
  setMetricValue("category", "—");
  setMetricValue("recommendation", "—");
  document.getElementById("summaryText").textContent =
    "Visit a supported shopping page to get a quick MapleMind check.";
  renderDetailList([
    "Open a supported product page to see budget fit, deadline risk, and your recommended next step."
  ]);
  renderTags([]);
}

function renderResult(data) {
  if (data.fitsBudget && data.deadlineRisk === "none") {
    setBadge("On Track", "is-positive");
  } else if (data.deadlineRisk === "high") {
    setBadge("Needs Review", "is-danger");
  } else {
    setBadge("Be Careful", "is-warning");
  }

  document.getElementById("purchaseAmount").textContent =
    formatCurrency(data.purchaseAmount);

  const budgetDisplay = getBudgetDisplay(data);
  setMetricValue("budgetFit", budgetDisplay.text, budgetDisplay.tone);

  const deadlineDisplay = getDeadlineDisplay(data);
  setMetricValue("deadlineRisk", deadlineDisplay.text, deadlineDisplay.tone);

  setMetricValue("category", titleCase(data.detectedCategory));
  setMetricValue("recommendation", titleCase(data.recommendation));

  document.getElementById("summaryText").textContent = getSummaryText(data);

  renderDetailList(getDetailItems(data));
  renderTags(data.tags || []);
}

async function loadAnalysis() {
  const stored = await chrome.storage.local.get(["lastAnalysis"]);

  if (!stored.lastAnalysis) {
    renderEmpty();
    return;
  }

  renderResult(stored.lastAnalysis);
}

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("openDashboardBtn");

  if (button) {
    button.addEventListener("click", () => {
      chrome.tabs.create({ url: DASHBOARD_URL });
    });
  }

  loadAnalysis();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.lastAnalysis) {
    loadAnalysis();
  }
});