import { DEFAULT_USER_PROFILE, PROFILE_FLAG_KEYS, type AgeValue, type UserProfile } from "@/types/profile";

const AGE_RANGE_REGEX = /^(\d{1,3})\s*-\s*(\d{1,3})$/;

export function normalizeAgeValue(value: unknown): AgeValue | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^\d{1,3}$/.test(trimmed)) {
    return Number(trimmed);
  }

  const rangeMatch = trimmed.match(AGE_RANGE_REGEX);
  if (rangeMatch) {
    return `${Number(rangeMatch[1])}-${Number(rangeMatch[2])}`;
  }

  return trimmed;
}

export function normalizeProvince(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

export function normalizeUserProfile(value: unknown): UserProfile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const profile: UserProfile = { ...DEFAULT_USER_PROFILE };

  for (const key of PROFILE_FLAG_KEYS) {
    profile[key] = source[key] === true;
  }

  const age = normalizeAgeValue(source.age);
  if (age !== undefined) {
    profile.age = age;
  }

  const province = normalizeProvince(source.province);
  if (province) {
    profile.province = province;
  }

  return profile;
}
