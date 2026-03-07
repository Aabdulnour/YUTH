export type ShoppingPageType = "product" | "cart" | "checkout";

export interface ShoppingItem {
  name?: string;
  price?: number;
  quantity?: number;
}

export interface ShoppingPageContext {
  url: string;
  hostname: string;
  merchant: string;
  pageType: ShoppingPageType;
  title?: string;
  price?: number;
  subtotal?: number;
  total?: number;
  quantity?: number;
  currency?: string;
  extractedText?: string[];
  items?: ShoppingItem[];
}

export interface AnalyzeRequest {
  userId?: string;
  useDemoProfile?: boolean;
  page: ShoppingPageContext;
}

export type Recommendation =
  | "buy_now"
  | "wait"
  | "find_cheaper_option"
  | "save_for_later"
  | "review_budget";

export interface AnalyzeResult {
  fitsBudget: boolean;
  confidence: "high" | "medium" | "low";
  detectedCategory: string;
  purchaseAmount: number;
  projectedCategorySpend?: number;
  categoryCap?: number;
  projectedDiscretionarySpend?: number;
  discretionaryBudget?: number;
  deadlineRisk: "none" | "watch" | "high";
  goalImpact: "positive" | "neutral" | "negative";
  matchedDeadlines: string[];
  matchedGoals: string[];
  recommendation: Recommendation;
  explanation: string;
  tags: string[];
}

export interface AnalyzeResponse {
  ok: boolean;
  result: AnalyzeResult;
}