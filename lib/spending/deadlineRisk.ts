import type { SpendingProfile } from "@/types/spending";

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getDeadlineRisk(
  profile: SpendingProfile,
  purchaseAmount: number
): {
  deadlineRisk: "none" | "watch" | "high";
  matchedDeadlines: string[];
} {
  const urgent = profile.upcomingDeadlines.filter((deadline) => {
    const days = daysUntil(deadline.dueDate);
    return deadline.priority === "high" && days <= 7;
  });

  const soon = profile.upcomingDeadlines.filter((deadline) => {
    const days = daysUntil(deadline.dueDate);
    return days <= 14;
  });

  const totalCurrentSpend = Object.values(profile.currentMonthSpend).reduce(
    (sum, value) => sum + (value ?? 0),
    0
  );

  const remainingDiscretionary =
    profile.discretionaryBudgetMonthly - totalCurrentSpend - purchaseAmount;

  const urgentRequired = urgent.reduce((sum, deadline) => sum + deadline.amount, 0);

  if (urgent.length > 0 && remainingDiscretionary < 0) {
    return {
      deadlineRisk: "high",
      matchedDeadlines: urgent.map((d) => d.title)
    };
  }

  if (urgent.length > 0 && remainingDiscretionary < urgentRequired * 0.1) {
    return {
      deadlineRisk: "high",
      matchedDeadlines: urgent.map((d) => d.title)
    };
  }

  if (soon.length > 0) {
    return {
      deadlineRisk: "watch",
      matchedDeadlines: soon.map((d) => d.title)
    };
  }

  return {
    deadlineRisk: "none",
    matchedDeadlines: []
  };
}