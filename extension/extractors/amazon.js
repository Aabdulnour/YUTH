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

export function extractAmazonPage() {
  const title =
    document.querySelector("#productTitle")?.textContent?.trim() ||
    document.querySelector("#title")?.textContent?.trim() ||
    document.title;

  const priceText =
    document.querySelector("#corePrice_feature_div .a-offscreen")?.textContent ||
    document.querySelector(".a-price .a-offscreen")?.textContent ||
    document.querySelector("#priceblock_ourprice")?.textContent ||
    document.querySelector("#priceblock_dealprice")?.textContent ||
    document.querySelector("#price_inside_buybox")?.textContent ||
    null;

  return {
    merchant: "amazon",
    pageType: "product",
    title,
    price: parsePrice(priceText),
    url: window.location.href,
    hostname: window.location.hostname,
  };
}
