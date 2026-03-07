let lastAnalyzedUrl = null;

const DUMMY_PROFILE = {
  discretionaryBudget: 300,
  currentDiscretionarySpend: 200,
  categoryBudgets: {
    electronics: 120,
    beauty: 80,
    clothing: 100,
    general: 150
  },
  currentCategorySpend: {
    electronics: 60,
    beauty: 25,
    clothing: 40,
    general: 90
  },
  goals: ["save for summer trip", "reduce impulse purchases"],
  upcomingDeadlines: [
    { label: "Phone bill", date: "2026-03-10", amount: 45 },
    { label: "Gym membership", date: "2026-03-11", amount: 30 }
  ]
};

function getMerchant() {
  const host = window.location.hostname;

  if (host.includes("amazon.")) return "amazon";
  if (host.includes("bestbuy.")) return "bestbuy";
  if (host.includes("sephora.")) return "sephora";

  return "unknown";
}

function isSupportedProductPage() {
  const host = window.location.hostname;
  const path = window.location.pathname;

  if (host.includes("amazon.")) {
    return path.includes("/dp/") || path.includes("/gp/product/");
  }

  return true;
}

function extractAmazonProductData() {
  const title =
    document.querySelector("#productTitle")?.innerText?.trim() ||
    document.querySelector("#title")?.innerText?.trim() ||
    document.title;

  const priceText =
    document.querySelector("#corePrice_feature_div .a-offscreen")?.innerText ||
    document.querySelector(".a-price .a-offscreen")?.innerText ||
    document.querySelector("#priceblock_ourprice")?.innerText ||
    document.querySelector("#priceblock_dealprice")?.innerText ||
    document.querySelector("#price_inside_buybox")?.innerText ||
    null;

  const price = priceText
    ? parseFloat(priceText.replace(/[^0-9.]/g, ""))
    : null;

  return { title, price };
}

function extractProductData() {
  const merchant = getMerchant();

  if (merchant === "amazon") {
    return extractAmazonProductData();
  }

  return {
    title: document.title,
    price: null
  };
}

function detectCategory(title = "", merchant = "") {
  const text = `${title} ${merchant}`.toLowerCase();

  if (
    text.includes("laptop") ||
    text.includes("headphones") ||
    text.includes("keyboard") ||
    text.includes("mouse") ||
    text.includes("monitor") ||
    text.includes("ipad") ||
    text.includes("tablet") ||
    text.includes("camera") ||
    text.includes("charger") ||
    text.includes("electronics")
  ) {
    return "electronics";
  }

  if (
    text.includes("serum") ||
    text.includes("skincare") ||
    text.includes("makeup") ||
    text.includes("beauty") ||
    text.includes("moisturizer") ||
    text.includes("cleanser") ||
    text.includes("lipstick") ||
    text.includes("sephora")
  ) {
    return "beauty";
  }

  if (
    text.includes("shirt") ||
    text.includes("hoodie") ||
    text.includes("pants") ||
    text.includes("shoes") ||
    text.includes("jacket") ||
    text.includes("dress") ||
    text.includes("clothing")
  ) {
    return "clothing";
  }

  return "general";
}

function getDaysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getDeadlineRisk(deadlines = []) {
  if (!deadlines.length) return "none";

  const days = deadlines.map((d) => getDaysUntil(d.date));
  const minDays = Math.min(...days);

  if (minDays <= 3) return "high";
  if (minDays <= 7) return "watch";
  return "none";
}

function buildReasons({
  price,
  category,
  fitsBudget,
  fitsCategoryBudget,
  remainingAfterPurchase,
  deadlineRisk,
  matchedGoals
}) {
  const reasons = [];

  if (fitsBudget) {
    reasons.push("This purchase stays within the monthly discretionary budget.");
  } else {
    reasons.push("This purchase would push spending over the monthly discretionary budget.");
  }

  if (fitsCategoryBudget) {
    reasons.push(`It still fits within the current ${category} spending range.`);
  } else {
    reasons.push(`It would exceed the current ${category} category budget.`);
  }

  if (remainingAfterPurchase >= 0) {
    reasons.push(`You would still have ${formatCurrency(remainingAfterPurchase)} left after this purchase.`);
  }

  if (deadlineRisk === "high") {
    reasons.push("There are important upcoming payments very soon, so this is higher risk.");
  } else if (deadlineRisk === "watch") {
    reasons.push("There are upcoming deadlines soon, so spending should be watched.");
  }

  if (matchedGoals.length) {
    reasons.push(`This purchase is related to ${matchedGoals[0]}.`);
  } else {
    reasons.push("This looks more like a general discretionary purchase.");
  }

  return reasons;
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(amount);
}

function analyzeWithDummyData({ title, price, merchant }) {
  const category = detectCategory(title, merchant);

  const discretionaryBudget = DUMMY_PROFILE.discretionaryBudget;
  const currentDiscretionarySpend = DUMMY_PROFILE.currentDiscretionarySpend;
  const projectedDiscretionarySpend = currentDiscretionarySpend + price;
  const remainingAfterPurchase = discretionaryBudget - projectedDiscretionarySpend;

  const categoryBudget =
    DUMMY_PROFILE.categoryBudgets[category] ??
    DUMMY_PROFILE.categoryBudgets.general;

  const currentCategorySpend =
    DUMMY_PROFILE.currentCategorySpend[category] ?? 0;

  const projectedCategorySpend = currentCategorySpend + price;

  const fitsBudget = projectedDiscretionarySpend <= discretionaryBudget;
  const fitsCategoryBudget = projectedCategorySpend <= categoryBudget;
  const deadlineRisk = getDeadlineRisk(DUMMY_PROFILE.upcomingDeadlines);

  const matchedGoals = DUMMY_PROFILE.goals.filter((goal) => {
    const goalText = goal.toUpperCase();

    if (goalText.includes("Reduce impulse")) {
      return price > 75;
    }

    if (goalText.includes("Summer trip")) {
      return category === "general" || category === "clothing";
    }

    return false;
  });

  let recommendation = "Fits";

  if (!fitsBudget || !fitsCategoryBudget) {
    recommendation = "Over Limit";
  } else if (deadlineRisk === "high" && price > 50) {
    recommendation = "Watch";
  }

  const reasons = buildReasons({
    price,
    category,
    fitsBudget,
    fitsCategoryBudget,
    remainingAfterPurchase,
    deadlineRisk,
    matchedGoals
  });

  return {
    title,
    price,
    merchant,
    category,
    recommendation,
    fitsBudget,
    fitsCategoryBudget,
    discretionaryBudget,
    currentDiscretionarySpend,
    projectedDiscretionarySpend,
    remainingAfterPurchase,
    categoryBudget,
    currentCategorySpend,
    projectedCategorySpend,
    deadlineRisk,
    matchedGoals,
    reasons
  };
}

async function setLoadingState() {
  await chrome.storage.local.set({
    lastAnalysis: null,
    lastAnalysisError: null,
    lastAnalysisLoading: true,
    lastAnalysisIdle: false,
    lastAnalysisIdleMessage: null
  });
}

async function setErrorState(message) {
  await chrome.storage.local.set({
    lastAnalysis: null,
    lastAnalysisError: message,
    lastAnalysisLoading: false,
    lastAnalysisIdle: false,
    lastAnalysisIdleMessage: null
  });
}

async function setSuccessState(result) {
  await chrome.storage.local.set({
    lastAnalysis: result,
    lastAnalysisError: null,
    lastAnalysisLoading: false,
    lastAnalysisIdle: false,
    lastAnalysisIdleMessage: null
  });
}

async function analyzeCurrentPage() {
  const currentUrl = window.location.href;

  if (currentUrl === lastAnalyzedUrl) return;
  lastAnalyzedUrl = currentUrl;

  if (!isSupportedProductPage()) {
    await setErrorState("This page is not a supported product page.");
    return;
  }

  const data = extractProductData();

  if (!data.title || !data.price) {
    await setErrorState("Could not detect product title or price on this page.");
    return;
  }

  await setLoadingState();

  try {
    const result = analyzeWithDummyData({
      title: data.title,
      price: data.price,
      merchant: getMerchant()
    });

    await setSuccessState(result);
  } catch (error) {
    await setErrorState(error.message || "Failed to analyze page.");
  }
}

function watchUrlChanges() {
  let previousUrl = window.location.href;

  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;

    if (currentUrl !== previousUrl) {
      previousUrl = currentUrl;
      setTimeout(() => {
        analyzeCurrentPage();
      }, 700);
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

window.addEventListener("load", () => {
  setTimeout(() => {
    analyzeCurrentPage();
    watchUrlChanges();
  }, 1200);
});