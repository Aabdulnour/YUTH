export type AgeValue = number | string;

export interface UserProfile {
  age?: AgeValue;
  province?: string;
  employed: boolean;
  student: boolean;
  renter: boolean;
  hasCar: boolean;
  hasDebt: boolean;
  livesWithParents: boolean;
  filesTaxes: boolean;
  noEmployerBenefits: boolean;
  // Eligibility & context signals (additive, default false)
  isPostSecondary: boolean;
  isNewcomer: boolean;
  isIndigenous: boolean;
  hasEmergencySavings: boolean;
  hasDependent: boolean;
  // Roadmap progress — Record<taskId, completed>
  roadmapProgress?: Record<string, boolean>;
}

export type UserProfileFlagKey = Exclude<keyof UserProfile, "age" | "province" | "roadmapProgress">;

export interface ProfileMatchConditions extends Partial<Record<UserProfileFlagKey, boolean>> {
  ageMin?: number;
  ageMax?: number;
  provinceIn?: string[];
}

export const PROFILE_FLAG_KEYS: UserProfileFlagKey[] = [
  "employed",
  "student",
  "renter",
  "hasCar",
  "hasDebt",
  "livesWithParents",
  "filesTaxes",
  "noEmployerBenefits",
  "isPostSecondary",
  "isNewcomer",
  "isIndigenous",
  "hasEmergencySavings",
  "hasDependent",
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  employed: false,
  student: false,
  renter: false,
  hasCar: false,
  hasDebt: false,
  livesWithParents: false,
  filesTaxes: false,
  noEmployerBenefits: false,
  isPostSecondary: false,
  isNewcomer: false,
  isIndigenous: false,
  hasEmergencySavings: false,
  hasDependent: false,
};

export const PROFILE_FIELD_LABELS: Record<keyof UserProfile, string> = {
  age: "Age",
  province: "Province",
  employed: "Employed",
  student: "Student",
  renter: "Renter",
  hasCar: "Has a Car",
  hasDebt: "Has Debt",
  livesWithParents: "Lives with Parents",
  filesTaxes: "Files Taxes",
  noEmployerBenefits: "No Employer Benefits",
  isPostSecondary: "Post-Secondary Student",
  isNewcomer: "Newcomer / Recent Immigrant",
  isIndigenous: "Indigenous Identity",
  hasEmergencySavings: "Has Emergency Savings",
  hasDependent: "Has a Dependent",
  roadmapProgress: "Roadmap Progress",
};