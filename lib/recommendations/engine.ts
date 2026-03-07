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

const priorityWeight: Record<ActionPriority, number> = {
  high: 300,
  medium: 200,
  low: 100,
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

export type AdultScoreTier = "Starting Out" | "Progressing" | "Strong" | "Optimized";

export interface AdultScoreBreakdown {
  filesTaxes: number;
  emergencySavings: number;
  debtLoad: number;
  renterSignal: number;
  studentSignal: number;
  employerBenefits: number;
  actionProgress: number;
}

export interface AdultScoreSummary {
  score: number;
  tier: AdultScoreTier;
  completedActions: number;
  totalActions: number;
  breakdown: AdultScoreBreakdown;
}

export interface TopInsight {
  title: string;
  body: string;
  sourceLabel?: string;
  sourceUrl?: string;
}

export interface RecommendationResult {
  matchedBenefits: Benefit[];
  matchedActions: ActionItem[];
  estimatedValueRange: EstimatedValueRange;
  estimatedValueTotal: number;
  insights: string[];
  topInsight: TopInsight;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
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

function getActionBoost(action: ActionItem, profile: UserProfile): number {
  const tags = action.tags ?? [];
  let boost = 0;

  if (!profile.filesTaxes && action.id === "file_taxes") {
    boost += 250;
  }

  if (profile.renter && (tags.includes("rent") || tags.includes("renter_credit"))) {
    boost += 160;
  }

  if (profile.student && (tags.includes("student") || tags.includes("education") || tags.includes("tuition_credit"))) {
    boost += 160;
  }

  if (profile.employed && (tags.includes("employment") || tags.includes("benefits_optimization"))) {
    boost += 120;
  }

  if (!profile.hasEmergencySavings && (tags.includes("savings") || tags.includes("emergency_fund") || tags.includes("budgeting"))) {
    boost += 190;
  }

  if (profile.hasDebt && (tags.includes("debt") || tags.includes("credit"))) {
    boost += 100;
  }

  if (profile.noEmployerBenefits && (action.id === "optimize_work_benefits" || tags.includes("benefits_optimization"))) {
    boost += 200;
  }

  return boost;
}

function sortActions(actions: ActionItem[], profile: UserProfile): ActionItem[] {
  return [...actions].sort((first, second) => {
    const firstScore = priorityWeight[first.priority] + getActionBoost(first, profile);
    const secondScore = priorityWeight[second.priority] + getActionBoost(second, profile);

    if (firstScore !== secondScore) {
      return secondScore - firstScore;
    }

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

function buildProfileActions(profile: UserProfile): ActionItem[] {
  const actions: ActionItem[] = [];

  if (profile.renter) {
    actions.push({
      id: "claim_renter_credits",
      title: "Check renter credits and housing benefits",
      description:
        "Review renter-focused credits in your province and keep rent receipts organized for annual claims.",
      priority: "high",
      tags: ["rent", "renter_credit", "taxes"],
      sourceLabel: "Canada.ca Benefits Finder",
      sourceUrl: "https://www.canada.ca/en/services/benefits/finder.html",
      externalLink: "https://www.canada.ca/en/services/benefits/finder.html",
      externalLinkLabel: "Find renter supports",
    });
  }

  if (profile.student) {
    actions.push({
      id: "claim_tuition_tax_credits",
      title: "Claim tuition and student tax credits",
      description:
        "Gather T2202 and school records so you can claim tuition-related credits and avoid leaving education support unclaimed.",
      priority: "high",
      tags: ["student", "education", "tuition_credit", "taxes"],
      sourceLabel: "CRA",
      sourceUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/support-payments/line-32300-your-tuition-education-textbook-amounts.html",
      externalLink:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/support-payments/line-32300-your-tuition-education-textbook-amounts.html",
      externalLinkLabel: "Review tuition credits",
    });
  }

  if (profile.employed) {
    actions.push({
      id: "optimize_work_benefits",
      title: "Optimize work benefits and payroll deductions",
      description:
        "Review workplace benefits, tax deductions, and reimbursements so you are not missing claimable support through employment.",
      priority: profile.noEmployerBenefits ? "high" : "medium",
      tags: ["employment", "benefits_optimization", "taxes"],
      sourceLabel: "Financial Consumer Agency of Canada",
      sourceUrl: "https://www.canada.ca/en/financial-consumer-agency/services/savings-investments.html",
      externalLink: "https://www.canada.ca/en/financial-consumer-agency/services/savings-investments.html",
      externalLinkLabel: "Review benefit options",
    });
  }

  if (!profile.hasEmergencySavings) {
    actions.push({
      id: "build_emergency_fund",
      title: "Start a 3-month emergency savings fund",
      description:
        "Prioritize a starter emergency fund with automatic transfers before adding new discretionary spending goals.",
      priority: "high",
      tags: ["savings", "emergency_fund", "budgeting"],
      sourceLabel: "Financial Consumer Agency of Canada",
      sourceUrl: "https://www.canada.ca/en/financial-consumer-agency/services/savings.html",
      externalLink: "https://www.canada.ca/en/financial-consumer-agency/services/savings.html",
      externalLinkLabel: "Build your plan",
    });
  }

  return actions;
}

function buildInsights(profile: UserProfile, matchedBenefits: Benefit[]): string[] {
  const insights: string[] = [];

  if (!profile.filesTaxes) {
    insights.push("Filing taxes is your biggest unlock and can activate multiple credits.");
  }

  if (!profile.hasEmergencySavings) {
    insights.push("Emergency savings should be your first priority to reduce monthly financial stress.");
  }

  if (profile.student) {
    insights.push("Student status opens tuition credits and provincial aid opportunities each school year.");
  }

  if (profile.renter) {
    insights.push("As a renter, keep rent receipts and lease details ready for housing-related supports.");
  }

  if (profile.noEmployerBenefits) {
    insights.push("Without employer benefits, prioritize low-cost coverage and cash buffer actions.");
  }

  if (insights.length === 0 && matchedBenefits.length > 0) {
    insights.push("Your profile already matches useful supports, so the next step is claiming them in order.");
  }

  if (insights.length === 0) {
    insights.push("Complete additional profile details to unlock more precise recommendations.");
  }

  return insights.slice(0, 3);
}

function buildTopInsight(profile: UserProfile, insights: string[]): TopInsight {
  const province = profile.province?.toLowerCase() ?? "";

  if (profile.renter && province === "ontario") {
    return {
      title: "Top opportunity",
      body: "You may qualify for the Ontario Trillium Benefit. Filing taxes and keeping rent records ready can improve your claim readiness.",
      sourceLabel: "Ontario.ca",
      sourceUrl: "https://www.ontario.ca/page/ontario-trillium-benefit",
    };
  }

  if (!profile.filesTaxes) {
    return {
      title: "Top opportunity",
      body: "File your taxes first. Most credits and payments depend on an up-to-date return.",
      sourceLabel: "CRA",
      sourceUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return.html",
    };
  }

  if (profile.student) {
    return {
      title: "Top opportunity",
      body: "Claim tuition and student aid credits early each term so funding can flow on time.",
      sourceLabel: "Canada Student Aid",
      sourceUrl: "https://www.canada.ca/en/services/benefits/education/student-aid.html",
    };
  }

  if (!profile.hasEmergencySavings) {
    return {
      title: "Top opportunity",
      body: "A starter emergency fund is your highest leverage move right now for financial stability.",
      sourceLabel: "Financial Consumer Agency of Canada",
      sourceUrl: "https://www.canada.ca/en/financial-consumer-agency/services/savings.html",
    };
  }

  if (profile.employed) {
    return {
      title: "Top opportunity",
      body: "Review workplace benefits and payroll deductions. Small optimization here can increase monthly net value.",
      sourceLabel: "Financial Consumer Agency of Canada",
      sourceUrl: "https://www.canada.ca/en/financial-consumer-agency/services/savings-investments.html",
    };
  }

  return {
    title: "Top opportunity",
    body: insights[0] ?? "Complete one high-priority action this week to build momentum.",
  };
}

export function getAdultScoreTier(score: number): AdultScoreTier {
  if (score < 30) {
    return "Starting Out";
  }

  if (score < 60) {
    return "Progressing";
  }

  if (score < 85) {
    return "Strong";
  }

  return "Optimized";
}

export function calculateAdultScore(
  profile: UserProfile,
  completedActions: number,
  totalActions: number
): AdultScoreSummary {
  const safeTotal = Math.max(0, Math.round(totalActions));
  const safeCompleted = Math.max(0, Math.round(completedActions));
  const boundedCompleted = safeTotal > 0 ? Math.min(safeCompleted, safeTotal) : safeCompleted;

  const actionProgress = safeTotal > 0 ? Math.round((boundedCompleted / safeTotal) * 20) : 0;

  const breakdown: AdultScoreBreakdown = {
    filesTaxes: profile.filesTaxes ? 20 : 0,
    emergencySavings: profile.hasEmergencySavings ? 25 : 0,
    debtLoad: profile.hasDebt ? 0 : 15,
    renterSignal: profile.renter ? 5 : 0,
    studentSignal: profile.student ? 5 : 0,
    employerBenefits: profile.noEmployerBenefits ? 0 : 10,
    actionProgress,
  };

  const score = clampScore(
    breakdown.filesTaxes +
      breakdown.emergencySavings +
      breakdown.debtLoad +
      breakdown.renterSignal +
      breakdown.studentSignal +
      breakdown.employerBenefits +
      breakdown.actionProgress
  );

  return {
    score,
    tier: getAdultScoreTier(score),
    completedActions: boundedCompleted,
    totalActions: safeTotal,
    breakdown,
  };
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

  baseActions.push(...buildProfileActions(profile));

  const matchedBenefits = dedupeById(baseBenefits);
  const matchedActions = sortActions(dedupeById(baseActions), profile);
  const estimatedValueRange = summarizeEstimatedValue(matchedBenefits);
  const insights = buildInsights(profile, matchedBenefits);

  return {
    matchedBenefits,
    matchedActions,
    estimatedValueRange,
    estimatedValueTotal: Math.round((estimatedValueRange.min + estimatedValueRange.max) / 2),
    insights,
    topInsight: buildTopInsight(profile, insights),
  };
}
