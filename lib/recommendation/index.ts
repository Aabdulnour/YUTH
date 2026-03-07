import actionsData from "@/data/actions.json";
import benefitsData from "@/data/benefits.json";
import type { ActionItem, ActionPriority } from "@/types/action";
import type { Benefit } from "@/types/benefit";
import {
  PROFILE_FLAG_KEYS,
  type ProfileMatchConditions,
  type UserProfile,
} from "@/types/profile";

const benefitCatalog: Benefit[] = benefitsData as Benefit[];
const actionCatalog: ActionItem[] = actionsData as ActionItem[];

const priorityRank: Record<ActionPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

interface AgeBounds {
  min?: number;
  max?: number;
}

export interface EstimatedValueRange {
  min: number;
  max: number;
  label: string;
}

export interface RecommendationResult {
  matchedBenefits: Benefit[];
  matchedActions: ActionItem[];
  estimatedValueRange: EstimatedValueRange;
  estimatedValueTotal: number;
  insights: string[];
}

function getAgeBounds(age: UserProfile["age"]): AgeBounds {
  if (typeof age === "number" && Number.isFinite(age)) {
    return { min: age, max: age };
  }

  if (typeof age === "string") {
    const trimmed = age.trim();
    const rangeMatch = trimmed.match(/^(\d{1,3})\s*-\s*(\d{1,3})$/);
    if (rangeMatch) {
      const first = Number(rangeMatch[1]);
      const second = Number(rangeMatch[2]);
      return { min: Math.min(first, second), max: Math.max(first, second) };
    }

    if (/^\d{1,3}$/.test(trimmed)) {
      const singleValue = Number(trimmed);
      return { min: singleValue, max: singleValue };
    }
  }

  return {};
}

function isYoungAdult(profile: UserProfile): boolean {
  const ageBounds = getAgeBounds(profile.age);

  if (typeof ageBounds.max === "number") {
    return ageBounds.max <= 30;
  }

  if (typeof ageBounds.min === "number") {
    return ageBounds.min <= 30;
  }

  return profile.student || profile.livesWithParents;
}

function normalizeProvinceValue(province: string): string {
  return province.trim().toLowerCase();
}

function matchesConditions(profile: UserProfile, conditions?: ProfileMatchConditions): boolean {
  if (!conditions) {
    return true;
  }

  for (const key of PROFILE_FLAG_KEYS) {
    const expectedValue = conditions[key];
    if (typeof expectedValue === "boolean" && profile[key] !== expectedValue) {
      return false;
    }
  }

  const ageBounds = getAgeBounds(profile.age);

  if (typeof conditions.ageMin === "number" && typeof ageBounds.max === "number") {
    if (ageBounds.max < conditions.ageMin) {
      return false;
    }
  }

  if (typeof conditions.ageMax === "number" && typeof ageBounds.min === "number") {
    if (ageBounds.min > conditions.ageMax) {
      return false;
    }
  }

  if (conditions.provinceIn?.length && profile.province) {
    const profileProvince = normalizeProvinceValue(profile.province);
    const allowedProvinces = conditions.provinceIn.map(normalizeProvinceValue);
    if (!allowedProvinces.includes(profileProvince)) {
      return false;
    }
  }

  return true;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function sortActions(actions: ActionItem[]): ActionItem[] {
  return [...actions].sort((first, second) => {
    const priorityDifference = priorityRank[first.priority] - priorityRank[second.priority];
    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return first.title.localeCompare(second.title);
  });
}

function summarizeEstimatedValue(benefits: Benefit[]): EstimatedValueRange {
  const totals = benefits.reduce(
    (accumulator, benefit) => {
      return {
        min: accumulator.min + benefit.estimated_value.min,
        max: accumulator.max + benefit.estimated_value.max,
      };
    },
    { min: 0, max: 0 }
  );

  const currencyFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });

  const label =
    totals.min === totals.max
      ? currencyFormatter.format(totals.min)
      : `${currencyFormatter.format(totals.min)} to ${currencyFormatter.format(totals.max)}`;

  return {
    min: totals.min,
    max: totals.max,
    label,
  };
}

function buildInsights(profile: UserProfile, matchedBenefits: Benefit[]): string[] {
  const insights: string[] = [];

  if (!profile.filesTaxes) {
    insights.push("Filing taxes is your biggest unlock and can activate multiple credits.");
  }

  if (profile.student && profile.employed) {
    insights.push("Since you study and work, you may be able to stack grants with worker credits.");
  } else if (profile.student) {
    insights.push("Student status opens federal and provincial funding opportunities each school year.");
  }

  if (profile.renter) {
    insights.push("As a renter, keep your lease and rent receipts ready for provincial support applications.");
  }

  if (profile.hasDebt) {
    insights.push("Debt is a priority signal, so focus on repayment structure before new recurring costs.");
  }

  if (isYoungAdult(profile) && (profile.renter || profile.livesWithParents)) {
    insights.push("FHSA can be high impact if buying a first home is a realistic medium-term goal.");
  }

  if (profile.noEmployerBenefits) {
    insights.push("Without employer benefits, prioritize emergency savings and low-cost coverage options.");
  }

  if (insights.length === 0 && matchedBenefits.length > 0) {
    insights.push("Your profile already matches useful supports, so the next step is claiming them in order.");
  }

  if (insights.length === 0) {
    insights.push("Complete your profile details to unlock more precise recommendations.");
  }

  return insights.slice(0, 3);
}

export function getRecommendations(profile: UserProfile): RecommendationResult {
  const baseBenefits = benefitCatalog.filter((benefit) => matchesConditions(profile, benefit.conditions));
  const baseActions = actionCatalog.filter((action) => matchesConditions(profile, action.conditions));

  if (isYoungAdult(profile) && (profile.renter || profile.livesWithParents)) {
    const fhsa = benefitCatalog.find((benefit) => benefit.id === "fhsa");
    if (fhsa) {
      baseBenefits.push(fhsa);
    }
  }

  if ((profile.hasDebt || profile.hasCar) && !baseActions.some((action) => action.id === "check_credit_score")) {
    const creditScoreAction = actionCatalog.find((action) => action.id === "check_credit_score");
    if (creditScoreAction) {
      baseActions.push(creditScoreAction);
    }
  }

  const matchedBenefits = dedupeById(baseBenefits);
  const matchedActions = sortActions(dedupeById(baseActions));
  const estimatedValueRange = summarizeEstimatedValue(matchedBenefits);

  return {
    matchedBenefits,
    matchedActions,
    estimatedValueRange,
    estimatedValueTotal: Math.round((estimatedValueRange.min + estimatedValueRange.max) / 2),
    insights: buildInsights(profile, matchedBenefits),
  };
}
