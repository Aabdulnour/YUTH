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
  id: "life" | "financial" | "eligibility";
  title: string;
  description: string;
  options: OnboardingOption[];
}

export const ONBOARDING_AGE_MIN = 16;
export const ONBOARDING_AGE_MAX = 100;

export const LIFE_SITUATION_OPTIONS: OnboardingOption[] = [
  { key: "student", label: "Student", helperText: "Enrolled in high school, college, or university." },
  { key: "employed", label: "Employed", helperText: "Working part-time, full-time, or on contract." },
  { key: "renter", label: "Renter", helperText: "Paying rent for your current housing." },
  { key: "livesWithParents", label: "Lives with parents", helperText: "Living at home with parents or guardians." },
];

export const FINANCIAL_SITUATION_OPTIONS: OnboardingOption[] = [
  { key: "hasDebt", label: "Carrying debt", helperText: "Credit card, loan, or line of credit debt currently." },
  { key: "hasCar", label: "Have a car", helperText: "Own or regularly pay for a vehicle." },
  { key: "filesTaxes", label: "Files taxes", helperText: "File a Canadian income tax return each year." },
  {
    key: "noEmployerBenefits",
    label: "No employer benefits",
    helperText: "No extended health or dental coverage through work.",
  },
  {
    key: "hasEmergencySavings",
    label: "Has emergency savings",
    helperText: "Have at least 3 months of living expenses saved.",
  },
];

export const ELIGIBILITY_CONTEXT_OPTIONS: OnboardingOption[] = [
  {
    key: "isPostSecondary",
    label: "Post-secondary student",
    helperText: "Currently enrolled in a college, university, or trade school program.",
  },
  {
    key: "isNewcomer",
    label: "Newcomer or recent immigrant",
    helperText: "Arrived in Canada within the last 5 years.",
  },
  {
    key: "isIndigenous",
    label: "Indigenous identity",
    helperText: "First Nations, Métis, or Inuit — relevant for specific federal and provincial support.",
  },
  {
    key: "hasDependent",
    label: "Supporting a dependent",
    helperText: "Caring for a child, aging parent, or another dependent.",
  },
];

export const ONBOARDING_OPTION_GROUPS: OnboardingOptionGroup[] = [
  {
    id: "life",
    title: "Life situation",
    description: "Select what best describes your current day-to-day setup.",
    options: LIFE_SITUATION_OPTIONS,
  },
  {
    id: "financial",
    title: "Financial situation",
    description: "Select the factors that most impact your money decisions right now.",
    options: FINANCIAL_SITUATION_OPTIONS,
  },
  {
    id: "eligibility",
    title: "Eligibility & context",
    description: "These signals improve recommendation matching for specific Canadian programs.",
    options: ELIGIBILITY_CONTEXT_OPTIONS,
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
