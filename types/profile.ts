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
}

export type UserProfileFlagKey = Exclude<keyof UserProfile, "age" | "province">;

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
};
