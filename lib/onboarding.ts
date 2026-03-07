import { normalizeAgeValue, normalizeProvince } from "@/lib/profile-utils";
import {
  DEFAULT_USER_PROFILE,
  type UserProfile,
  type UserProfileFlagKey,
} from "@/types/profile";

export interface OnboardingOption {
  key: UserProfileFlagKey;
  label: string;
}

export const ONBOARDING_OPTIONS: OnboardingOption[] = [
  { key: "employed", label: "I have a job" },
  { key: "student", label: "I'm a student" },
  { key: "renter", label: "I pay rent" },
  { key: "hasCar", label: "I have a car" },
  { key: "hasDebt", label: "I have debt" },
  { key: "livesWithParents", label: "I live with parents" },
  { key: "filesTaxes", label: "I file taxes" },
  { key: "noEmployerBenefits", label: "I don't have employer benefits" },
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
  ageInput?: string;
  province?: string;
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
