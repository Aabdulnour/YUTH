import type { AnalyzeResult, ShoppingPageContext } from "@/types/extension";
import type { SpendingProfile, SpendingCategory } from "@/types/spending";
import { classifyCategory } from "./classifyCategory";
import { getDeadlineRisk } from "./deadlineRisk";
import { getGoalImpact } from "./goalImpact";

function getPurchaseAmount(page: ShoppingPageContext): number {
  return page.total ?? page.subtotal ?? page.price ?? 0;
}

function getCurrentDiscretionarySpend(profile: SpendingProfile): number {
  return Object.values(profile.currentMonthSpend).reduce(
    (sum, value) => sum + (value ?? 0),
    0
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCategory(category: SpendingCategory): string {
  if (category === "foodDelivery") {
    return "food delivery";
  }

  return category.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function buildExplanation(input: {
  fitsBudget: boolean;
  category: SpendingCategory;
  purchaseAmount: number;
  projectedCategorySpend: number;
  categoryCap: number;
  projectedDiscretionarySpend: number;
  discretionaryBudget: number;
  deadlineRisk: "none" | "watch" | "high";
  goalImpact: "positive" | "neutral" | "negative";
  matchedDeadlines: string[];
  matchedGoals: string[];
  recommendation: AnalyzeResult["recommendation"];
}): string {
  const lines: string[] = [];

  if (input.fitsBudget) {
    lines.push("MapleMind sees this purchase as within your monthly spending plan.");
  } else {
    lines.push("This purchase would push your monthly spending plan off track.");
  }

  lines.push(
    `Purchase amount checked: ${formatCurrency(input.purchaseAmount)}.`
  );

  lines.push(
    `Category check: ${formatCategory(input.category)} would move to ${formatCurrency(
      input.projectedCategorySpend
    )} of ${formatCurrency(input.categoryCap)}.`
  );

  lines.push(
    `Overall discretionary spend would become ${formatCurrency(
      input.projectedDiscretionarySpend
    )} of ${formatCurrency(input.discretionaryBudget)}.`
  );

  if (input.deadlineRisk === "high" && input.matchedDeadlines.length > 0) {
    lines.push(
      `Cash timing is tight because these payments are close: ${input.matchedDeadlines.join(", ")}.`
    );
  } else if (input.deadlineRisk === "watch" && input.matchedDeadlines.length > 0) {
    lines.push(
      `Keep an eye on upcoming payments: ${input.matchedDeadlines.join(", ")}.`
    );
  }

  if (input.goalImpact === "negative" && input.matchedGoals.length > 0) {
    lines.push(
      `This may slow progress on your goals, especially ${input.matchedGoals.join(", ")}.`
    );
  }

  switch (input.recommendation) {
    case "buy_now":
      lines.push("Recommendation: proceed if this purchase is still a priority.");
      break;
    case "wait":
      lines.push("Recommendation: wait until after the next payment window.");
      break;
    case "find_cheaper_option":
      lines.push("Recommendation: look for a lower-cost option in the same category.");
      break;
    case "save_for_later":
      lines.push("Recommendation: save this for later to keep your monthly plan stable.");
      break;
    case "review_budget":
      lines.push("Recommendation: review or complete your budget profile first.");
      break;
  }

  return lines.join(" ");
}

export function analyzeSpendCheck(
  page: ShoppingPageContext,
  profile: SpendingProfile
): AnalyzeResult {
  const purchaseAmount = getPurchaseAmount(page);
  const category = classifyCategory({
    merchant: page.merchant,
    title: page.title,
    extractedText: page.extractedText
  });

  const categoryCap = profile.categoryCaps[category] ?? profile.categoryCaps.general ?? 0;
  const currentCategorySpend = profile.currentMonthSpend[category] ?? 0;
  const projectedCategorySpend = currentCategorySpend + purchaseAmount;

  const currentDiscretionarySpend = getCurrentDiscretionarySpend(profile);
  const projectedDiscretionarySpend = currentDiscretionarySpend + purchaseAmount;

  const fitsBudget =
    projectedDiscretionarySpend <= profile.discretionaryBudgetMonthly &&
    projectedCategorySpend <= categoryCap;

  const { deadlineRisk, matchedDeadlines } = getDeadlineRisk(profile, purchaseAmount);
  const { goalImpact, matchedGoals } = getGoalImpact(profile, purchaseAmount);

  const profileComplete =
    profile.discretionaryBudgetMonthly > 0 &&
    Object.keys(profile.categoryCaps).length > 0;

  let recommendation: AnalyzeResult["recommendation"] = "buy_now";

  if (!profileComplete) {
    recommendation = "review_budget";
  } else if (deadlineRisk === "high") {
    recommendation = "wait";
  } else if (!fitsBudget && projectedDiscretionarySpend <= profile.discretionaryBudgetMonthly) {
    recommendation = "find_cheaper_option";
  } else if (!fitsBudget) {
    recommendation = "save_for_later";
  }

  const explanation = buildExplanation({
    fitsBudget,
    category,
    purchaseAmount,
    projectedCategorySpend,
    categoryCap,
    projectedDiscretionarySpend,
    discretionaryBudget: profile.discretionaryBudgetMonthly,
    deadlineRisk,
    goalImpact,
    matchedDeadlines,
    matchedGoals,
    recommendation
  });

  return {
    fitsBudget,
    confidence: purchaseAmount > 0 ? "high" : "low",
    detectedCategory: category,
    purchaseAmount,
    projectedCategorySpend,
    categoryCap,
    projectedDiscretionarySpend,
    discretionaryBudget: profile.discretionaryBudgetMonthly,
    deadlineRisk,
    goalImpact,
    matchedDeadlines,
    matchedGoals,
    recommendation,
    explanation,
    tags: [
      "MapleMind budget rules",
      category,
      deadlineRisk !== "none" ? "deadline-aware" : "budget-fit",
      goalImpact === "negative" ? "goal-impact" : "goal-neutral"
    ]
  };
}
