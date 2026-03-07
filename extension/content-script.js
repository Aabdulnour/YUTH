const EXTENSION_CONFIG = globalThis.MAPLEMIND_EXTENSION_CONFIG ?? {
  apiBaseUrl: "http://localhost:3000",
  previewMode: true,
};

const ANALYZE_ENDPOINT = `${EXTENSION_CONFIG.apiBaseUrl}/api/extension/analyze`;
const LINKED_USER_ID_KEY = "maplemindLinkedUserId";

let lastAnalyzedUrl = null;

const TITLE_SELECTORS = {
  amazon: ["#productTitle", "#title"],
  bestbuy: ["h1", "[data-automation='product-title']"],
  sephora: ["h1", "[data-at='product_name']"],
};

const PRICE_SELECTORS = {
  amazon: [
    "#corePrice_feature_div .a-offscreen",
    ".a-price .a-offscreen",
    "#priceblock_ourprice",
    "#priceblock_dealprice",
    "#price_inside_buybox",
  ],
  bestbuy: [
    ".priceView-customer-price span",
    "[data-automation='product-price']",
    "[itemprop='price']",
  ],
  sephora: [
    "[data-comp='Price ']",
    "[data-at='price']",
    "[itemprop='price']",
  ],
};

function detectMerchant(hostname = window.location.hostname) {
  const host = hostname.toLowerCase();

  if (host.includes("amazon.")) return "amazon";
  if (host.includes("bestbuy.")) return "bestbuy";
  if (host.includes("sephora.")) return "sephora";

  return null;
}

function isSupportedProductPage(merchant, pathname = window.location.pathname) {
  if (merchant === "amazon") {
    return pathname.includes("/dp/") || pathname.includes("/gp/product/");
  }

  if (merchant === "bestbuy") {
    return pathname.includes("/product/") || pathname.includes("/en-ca/product/");
  }

  if (merchant === "sephora") {
    return pathname.includes("/product/") || pathname.includes("/shop/");
  }

  return false;
}

function parsePrice(rawValue) {
  if (!rawValue) {
    return null;
  }

  let cleaned = String(rawValue).replace(/[^0-9.,]/g, "");

  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",") && !cleaned.includes(".")) {
    const parts = cleaned.split(",");
    const decimals = parts[parts.length - 1];

    if (decimals && decimals.length === 2) {
      cleaned = `${parts.slice(0, -1).join("")}.${decimals}`;
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }

  const match = cleaned.match(/(\d+(?:\.\d{1,2})?)/);

  if (!match) {
    return null;
  }

  const price = Number(match[1]);

  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  return price;
}

function readTextFromSelectors(selectors = []) {
  for (const selector of selectors) {
    const text = document.querySelector(selector)?.textContent?.trim();
    if (text) {
      return text;
    }
  }

  return null;
}

function extractPrice(merchant) {
  const selectorPriceText = readTextFromSelectors(PRICE_SELECTORS[merchant] ?? []);
  const selectorPrice = parsePrice(selectorPriceText);

  if (selectorPrice) {
    return selectorPrice;
  }

  const metaPrice = parsePrice(
    document.querySelector("meta[property='product:price:amount']")?.getAttribute("content")
  );

  return metaPrice;
}

function extractTitle(merchant) {
  const titleFromSelector = readTextFromSelectors(TITLE_SELECTORS[merchant] ?? []);
  if (titleFromSelector) {
    return titleFromSelector;
  }

  return document.title?.trim() || null;
}

function buildPageContext(merchant) {
  return {
    url: window.location.href,
    hostname: window.location.hostname,
    merchant,
    pageType: "product",
    title: extractTitle(merchant) ?? undefined,
    price: extractPrice(merchant) ?? undefined,
    currency: "CAD",
  };
}

function formatMerchantLabel(merchant) {
  if (merchant === "bestbuy") return "Best Buy";
  return merchant.charAt(0).toUpperCase() + merchant.slice(1);
}

function getFriendlyErrorMessage(error) {
  const message = error instanceof Error ? error.message : "Unknown extension error.";

  if (
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("ERR_CONNECTION_REFUSED")
  ) {
    return "Could not reach MapleMind at http://localhost:3000. Start the web app, then refresh this page.";
  }

  return message;
}

async function getLinkedMapleMindUserId() {
  try {
    const stored = await chrome.storage.local.get([LINKED_USER_ID_KEY]);
    const linkedUserId = stored[LINKED_USER_ID_KEY];

    if (typeof linkedUserId === "string" && linkedUserId.trim()) {
      return linkedUserId;
    }
  } catch {
    // Ignore storage read errors and continue in anonymous mode.
  }

  return null;
}

async function requestAnalysis(page) {
  const linkedUserId = await getLinkedMapleMindUserId();

  const response = await fetch(ANALYZE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: linkedUserId ?? undefined,
      useDemoProfile: linkedUserId ? false : true,
      page,
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    const apiError = payload?.error;
    throw new Error(apiError || "MapleMind could not analyze this page right now.");
  }

  const analysis = payload.analysis ?? payload.result;
  if (!analysis) {
    throw new Error("MapleMind returned an empty extension analysis response.");
  }

  return payload;
}

function mapAnalysisForStorage(payload, page) {
  return {
    analyzedAt: new Date().toISOString(),
    page: {
      title: page.title,
      merchant: page.merchant,
      pageType: page.pageType,
      url: page.url,
    },
    analysis: payload.analysis ?? payload.result,
    metadata: {
      profileSource: payload.metadata?.profileSource ?? "demo_profile",
      mode: payload.metadata?.mode ?? "preview",
      note:
        payload.metadata?.note ??
        "Preview mode: MapleMind is using a demo spending profile for extension analysis.",
    },
  };
}

async function setLoadingState() {
  await chrome.storage.local.set({
    lastAnalysis: null,
    lastAnalysisError: null,
    lastAnalysisLoading: true,
    lastAnalysisIdle: false,
    lastAnalysisIdleMessage: null,
  });
}

async function setIdleState(message) {
  await chrome.storage.local.set({
    lastAnalysis: null,
    lastAnalysisError: null,
    lastAnalysisLoading: false,
    lastAnalysisIdle: true,
    lastAnalysisIdleMessage: message,
  });
}

async function setErrorState(message) {
  await chrome.storage.local.set({
    lastAnalysis: null,
    lastAnalysisError: message,
    lastAnalysisLoading: false,
    lastAnalysisIdle: false,
    lastAnalysisIdleMessage: null,
  });
}

async function setSuccessState(result) {
  await chrome.storage.local.set({
    lastAnalysis: result,
    lastAnalysisError: null,
    lastAnalysisLoading: false,
    lastAnalysisIdle: false,
    lastAnalysisIdleMessage: null,
  });
}

async function analyzeCurrentPage() {
  const currentUrl = window.location.href;

  if (currentUrl === lastAnalyzedUrl) {
    return;
  }

  lastAnalyzedUrl = currentUrl;

  const merchant = detectMerchant();
  if (!merchant) {
    await setIdleState(
      "MapleMind preview currently supports Amazon, Best Buy, and Sephora product pages."
    );
    return;
  }

  if (!isSupportedProductPage(merchant)) {
    await setIdleState(
      `Open a ${formatMerchantLabel(merchant)} product detail page to get MapleMind guidance.`
    );
    return;
  }

  const page = buildPageContext(merchant);
  if (!page.title || !page.price) {
    await setErrorState("MapleMind could not detect the product title or price on this page.");
    return;
  }

  await setLoadingState();

  try {
    const payload = await requestAnalysis(page);
    const mappedResult = mapAnalysisForStorage(payload, page);
    await setSuccessState(mappedResult);
  } catch (error) {
    await setErrorState(getFriendlyErrorMessage(error));
  }
}

function watchUrlChanges() {
  let previousUrl = window.location.href;

  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;

    if (currentUrl !== previousUrl) {
      previousUrl = currentUrl;
      window.setTimeout(() => {
        void analyzeCurrentPage();
      }, 700);
    }
  });

  if (!document.body) {
    return;
  }

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

window.addEventListener("load", () => {
  window.setTimeout(() => {
    void analyzeCurrentPage();
    watchUrlChanges();
  }, 1200);
});
