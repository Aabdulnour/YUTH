import type { SpendingProfile } from "@/types/spending";

export function getGoalImpact(
  profile: SpendingProfile,
  purchaseAmount: number
): {
  goalImpact: "positive" | "neutral" | "negative";
  matchedGoals: string[];
} {
  const highPriorityGoals = profile.goals.filter(
    (goal) => goal.priority === "high" && (goal.monthlyTarget ?? 0) > 0
  );

  if (highPriorityGoals.length === 0) {
    return { goalImpact: "neutral", matchedGoals: [] };
  }

  const totalMonthlyGoalTarget = highPriorityGoals.reduce(
    (sum, goal) => sum + (goal.monthlyTarget ?? 0),
    0
  );

  if (purchaseAmount >= totalMonthlyGoalTarget * 0.5) {
    return {
      goalImpact: "negative",
      matchedGoals: highPriorityGoals.map((g) => g.name)
    };
  }

  return {
    goalImpact: "neutral",
    matchedGoals: highPriorityGoals.map((g) => g.name)
  };
}