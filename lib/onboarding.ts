import { normalizeAgeValue, normalizeProvince } from "@/lib/profile-utils";
import {
  DEFAULT_USER_PROFILE,
  type UserProfile,
  type UserProfileFlagKey,
} from "@/types/profile";

export interface OnboardingOption {
  key: UserProfileFlagKey;
  label: string;
  helperText: string;
}

export interface OnboardingOptionGroup {
  id: "education" | "housing" | "finances";
  title: string;
  description: string;
  options: OnboardingOption[];
}

export const ONBOARDING_AGE_MIN = 16;
export const ONBOARDING_AGE_MAX = 100;

export const EDUCATION_BACKGROUND_OPTIONS: OnboardingOption[] = [
  { key: "student", label: "Currently a student", helperText: "In school, college, or university." },
  { key: "isPostSecondary", label: "Post-secondary student", helperText: "Enrolled in college, university, or trade school." },
  { key: "isNewcomer", label: "Newcomer to Canada", helperText: "Arrived in Canada within the last 5 years." },
  { key: "isIndigenous", label: "Indigenous identity", helperText: "First Nations, Métis, or Inuit." },
];

export const HOUSING_LIFE_OPTIONS: OnboardingOption[] = [
  { key: "renter", label: "Renter", helperText: "Currently paying rent." },
  { key: "livesWithParents", label: "Lives with parents", helperText: "Living with parents or guardians." },
  { key: "hasCar", label: "Has a car", helperText: "Own or regularly pay for a vehicle." },
  { key: "noEmployerBenefits", label: "No employer benefits", helperText: "No extended health or dental through work." },
];

export const WORK_FINANCES_OPTIONS: OnboardingOption[] = [
  { key: "employed", label: "Employed", helperText: "Currently earning income from work." },
  { key: "hasDebt", label: "Carrying debt", helperText: "Credit card, loan, or line of credit." },
  { key: "filesTaxes", label: "Files taxes", helperText: "Files a Canadian income tax return each year." },
  { key: "hasEmergencySavings", label: "Has emergency savings", helperText: "At least 3 months of expenses saved." },
  { key: "hasDependent", label: "Supporting a dependent", helperText: "Caring for a child, parent, or other dependent." },
];

// Keep backward compat: export old names as aliases
export const LIFE_SITUATION_OPTIONS = HOUSING_LIFE_OPTIONS;
export const FINANCIAL_SITUATION_OPTIONS = WORK_FINANCES_OPTIONS;
export const ELIGIBILITY_CONTEXT_OPTIONS = EDUCATION_BACKGROUND_OPTIONS;

export const ONBOARDING_OPTION_GROUPS: OnboardingOptionGroup[] = [
  {
    id: "education",
    title: "Education & background",
    description: "Select what applies to your current education and background.",
    options: EDUCATION_BACKGROUND_OPTIONS,
  },
  {
    id: "housing",
    title: "Housing & life setup",
    description: "Select what describes your living situation.",
    options: HOUSING_LIFE_OPTIONS,
  },
  {
    id: "finances",
    title: "Work, income & finances",
    description: "Select what applies to your financial situation.",
    options: WORK_FINANCES_OPTIONS,
  },
];

export const PROVINCE_OPTIONS: string[] = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
];

export interface BuildOnboardingProfileInput {
  selectedFlags: UserProfileFlagKey[];
  ageInput: string;
  province?: string;
}

export interface OnboardingAgeValidationResult {
  age?: number;
  error?: string;
}

export function validateOnboardingAgeInput(ageInput: string): OnboardingAgeValidationResult {
  const trimmed = ageInput.trim();
  if (!trimmed) {
    return { error: "Age is required." };
  }

  if (!/^\d{1,3}$/.test(trimmed)) {
    return { error: "Enter your age as a number." };
  }

  const numericAge = Number(trimmed);
  if (!Number.isInteger(numericAge)) {
    return { error: "Enter a valid whole number for age." };
  }

  if (numericAge < ONBOARDING_AGE_MIN || numericAge > ONBOARDING_AGE_MAX) {
    return {
      error: `Age must be between ${ONBOARDING_AGE_MIN} and ${ONBOARDING_AGE_MAX}.`,
    };
  }

  return { age: numericAge };
}

export function buildProfileFromOnboarding(input: BuildOnboardingProfileInput): UserProfile {
  const profile: UserProfile = { ...DEFAULT_USER_PROFILE };

  for (const key of input.selectedFlags) {
    profile[key] = true;
  }

  const age = normalizeAgeValue(input.ageInput);
  if (age !== undefined) {
    profile.age = age;
  }

  const province = normalizeProvince(input.province);
  if (province) {
    profile.province = province;
  }

  return profile;
}
