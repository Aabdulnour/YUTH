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

export type ExtensionProfileSource =
  | "demo_profile"
  | "authenticated_user_profile";

export type ExtensionDecisionStorageMode = "supabase" | "local";

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

export interface AnalyzeResponseMetadata {
  profileSource: ExtensionProfileSource;
  mode: "preview" | "live";
  note: string;
  requestedUserId: string | null;
  decisionHistoryStorage?: ExtensionDecisionStorageMode;
}

export interface ExtensionDecision {
  id: string;
  userId: string | null;
  merchant: string;
  pageTitle: string;
  pageUrl: string;
  recommendation: Recommendation;
  purchaseAmount: number;
  detectedCategory: string;
  deadlineRisk: AnalyzeResult["deadlineRisk"];
  goalImpact: AnalyzeResult["goalImpact"];
  createdAt: string;
}

export interface ExtensionDecisionsResponse {
  ok: boolean;
  decisions: ExtensionDecision[];
  storage: ExtensionDecisionStorageMode;
  error?: string;
}

export interface AnalyzeResponse {
  ok: boolean;
  analysis?: AnalyzeResult;
  // Backward-compatible alias for earlier prototype clients.
  result?: AnalyzeResult;
  metadata?: AnalyzeResponseMetadata;
  error?: string;
}
