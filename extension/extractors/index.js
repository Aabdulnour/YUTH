import { extractAmazonPage } from "./amazon.js";
import { extractBestBuyPage } from "./bestbuy.js";
import { extractSephoraPage } from "./sephora.js";

export function detectMerchant(hostname) {
  const host = hostname.toLowerCase();

  if (host.includes("amazon.ca")) return "amazon";
  if (host.includes("bestbuy.ca")) return "bestbuy";
  if (host.includes("sephora.ca") || host.includes("sephora.com")) return "sephora";

  return null;
}

export function extractPageContext() {
  const hostname = window.location.hostname;
  const merchant = detectMerchant(hostname);

  if (!merchant) return null;

  switch (merchant) {
    case "amazon":
      return extractAmazonPage();
    case "bestbuy":
      return extractBestBuyPage();
    case "sephora":
      return extractSephoraPage();
    default:
      return null;
  }
}