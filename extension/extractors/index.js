import { extractAmazonPage } from "./amazon.js";

export function detectMerchant(hostname) {
  const host = hostname.toLowerCase();

  if (host.includes("amazon.")) return "amazon";
  if (host.includes("bestbuy.ca")) return "bestbuy";
  if (host.includes("sephora.ca") || host.includes("sephora.com")) return "sephora";

  return null;
}

function parsePrice(rawValue) {
  if (!rawValue) return null;
  const cleaned = String(rawValue).replace(/[^0-9.,]/g, "");
  const normalized = cleaned.includes(",") && cleaned.includes(".")
    ? cleaned.replace(/,/g, "")
    : cleaned.replace(",", ".");
  const match = normalized.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) ? amount : null;
}

function extractGenericPage(merchant) {
  const title = document.querySelector("h1")?.textContent?.trim() || document.title;
  const priceText =
    document.querySelector("[itemprop='price']")?.getAttribute("content") ||
    document.querySelector("[data-automation='product-price']")?.textContent ||
    document.querySelector("[data-at='price']")?.textContent ||
    null;

  return {
    merchant,
    pageType: "product",
    title,
    price: parsePrice(priceText),
    url: window.location.href,
    hostname: window.location.hostname,
  };
}

export function extractPageContext() {
  const hostname = window.location.hostname;
  const merchant = detectMerchant(hostname);

  if (!merchant) return null;

  switch (merchant) {
    case "amazon":
      return extractAmazonPage();
    case "bestbuy":
      return extractGenericPage("bestbuy");
    case "sephora":
      return extractGenericPage("sephora");
    default:
      return null;
  }
}
