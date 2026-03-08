export interface SupportedExtensionMerchant {
  id: "amazon" | "bestbuy" | "sephora";
  name: string;
  hosts: string[];
  supportedPageTypes: Array<"product">;
}

export const SUPPORTED_EXTENSION_MERCHANTS: SupportedExtensionMerchant[] = [
  {
    id: "amazon",
    name: "Amazon",
    hosts: ["amazon.ca", "www.amazon.ca", "amazon.com", "www.amazon.com"],
    supportedPageTypes: ["product"],
  },
  {
    id: "bestbuy",
    name: "Best Buy",
    hosts: ["bestbuy.ca", "www.bestbuy.ca"],
    supportedPageTypes: ["product"],
  },
  {
    id: "sephora",
    name: "Sephora",
    hosts: ["sephora.ca", "www.sephora.ca", "sephora.com", "www.sephora.com"],
    supportedPageTypes: ["product"],
  },
];

export function isSupportedExtensionMerchant(merchant: string): boolean {
  return SUPPORTED_EXTENSION_MERCHANTS.some((entry) => entry.id === merchant);
}
