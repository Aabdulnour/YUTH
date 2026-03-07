export type DeadlineType =
  | "rent"
  | "credit_card"
  | "tuition"
  | "loan"
  | "subscription"
  | "savings_goal";

export type Priority = "high" | "medium" | "low";

export type GoalPriority = "high" | "medium" | "low";

export type SpendingCategory =
  | "shopping"
  | "clothing"
  | "electronics"
  | "foodDelivery"
  | "beauty"
  | "home"
  | "general";

export interface UpcomingDeadline {
  id: string;
  type: DeadlineType;
  title: string;
  amount: number;
  dueDate: string; // ISO string
  priority: Priority;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount?: number;
  targetDate?: string;
  monthlyTarget?: number;
  priority: GoalPriority;
}

export interface SpendingProfile {
  monthlyTakeHomeRange: string;
  discretionaryBudgetMonthly: number;
  categoryCaps: Partial<Record<SpendingCategory, number>>;
  currentMonthSpend: Partial<Record<SpendingCategory, number>>;
  upcomingDeadlines: UpcomingDeadline[];
  goals: FinancialGoal[];
}