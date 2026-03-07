import { normalizeUserProfile } from "@/lib/profile-utils";
import type { UserProfile } from "@/types/profile";

export const PROFILE_STORAGE_KEY = "maplemind_user_profile_v1";

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function loadUserProfile(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return normalizeUserProfile(parsed);
  } catch {
    return null;
  }
}
