import type { ProfileMatchConditions } from "./profile";

export type BenefitCategory =
  | "tax_credit"
  | "education"
  | "savings_account"
  | "housing"
  | "financial_support";

export interface EstimatedValue {
  min: number;
  max: number;
  display: string;
}

export interface Benefit {
  id: string;
  name: string;
  description: string;
  estimated_value: EstimatedValue;
  category: BenefitCategory;
  tags?: string[];
  conditions?: ProfileMatchConditions;
  sourceLabel?: string;
  sourceUrl?: string;
}
