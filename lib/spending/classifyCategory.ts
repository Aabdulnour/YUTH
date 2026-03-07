import type { SpendingCategory } from "@/types/spending";

const KEYWORDS: Record<SpendingCategory, string[]> = {
  shopping: ["shop", "shopping", "accessory", "bag", "gift"],
  clothing: ["shirt", "hoodie", "pants", "dress", "jacket", "shoe", "sneaker"],
  electronics: ["laptop", "keyboard", "headphones", "monitor", "ipad", "tablet", "camera"],
  foodDelivery: ["uber eats", "doordash", "takeout", "delivery", "restaurant"],
  beauty: ["skincare", "serum", "makeup", "perfume", "moisturizer", "sephora"],
  home: ["lamp", "chair", "desk", "bedding", "kitchen", "storage"],
  general: []
};

export function classifyCategory(input: {
  merchant?: string;
  title?: string;
  extractedText?: string[];
}): SpendingCategory {
  const haystack = [
    input.merchant ?? "",
    input.title ?? "",
    ...(input.extractedText ?? [])
  ]
    .join(" ")
    .toLowerCase();

  for (const [category, words] of Object.entries(KEYWORDS) as Array<
    [SpendingCategory, string[]]
  >) {
    if (words.some((word) => haystack.includes(word))) {
      return category;
    }
  }

  return "general";
}