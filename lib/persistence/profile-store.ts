import { normalizeUserProfile } from "@/lib/profile-utils";
import { loadUserProfile, saveUserProfile } from "@/lib/profile-storage";
import {
  isMissingTableError,
  isNoRowsError,
  isPermissionError,
  logSupabaseError,
  logSupabaseWarningOnce,
} from "@/lib/supabase/error-utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/profile";
import type { Database } from "@/types/supabase";

type UserProfileInsert = Database["public"]["Tables"]["user_profiles"]["Insert"];
type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];

const SCOPED_PROFILE_STORAGE_KEY_PREFIX = "maplemind_user_profile_v2";
const LEGACY_PROFILE_OWNER_KEY = "maplemind_user_profile_owner_v1";

function getScopedProfileStorageKey(userId: string): string {
  return `${SCOPED_PROFILE_STORAGE_KEY_PREFIX}:${userId}`;
}

function loadScopedLocalProfile(userId: string): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = localStorage.getItem(getScopedProfileStorageKey(userId));
  if (!rawValue) {
    return null;
  }

  try {
    return normalizeUserProfile(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

function loadLegacyProfileForUser(userId: string): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const ownerId = localStorage.getItem(LEGACY_PROFILE_OWNER_KEY);
  if (ownerId !== userId) {
    return null;
  }

  return loadUserProfile();
}

function saveLocalProfileCaches(userId: string, profile: UserProfile): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(getScopedProfileStorageKey(userId), JSON.stringify(profile));
    localStorage.setItem(LEGACY_PROFILE_OWNER_KEY, userId);
  }

  saveUserProfile(profile);
}

function loadProfileFromFallback(userId: string): UserProfile | null {
  return loadScopedLocalProfile(userId) ?? loadLegacyProfileForUser(userId);
}

function mapProfileToInsert(userId: string, profile: UserProfile): UserProfileInsert {
  return {
    user_id: userId,
    age: profile.age !== undefined ? String(profile.age) : null,
    province: profile.province ?? null,
    employed: profile.employed,
    student: profile.student,
    renter: profile.renter,
    has_car: profile.hasCar,
    has_debt: profile.hasDebt,
    lives_with_parents: profile.livesWithParents,
    files_taxes: profile.filesTaxes,
    no_employer_benefits: profile.noEmployerBenefits,
    // Eligibility & context (new additive fields)
    is_post_secondary: profile.isPostSecondary,
    is_newcomer: profile.isNewcomer,
    is_indigenous: profile.isIndigenous,
    has_emergency_savings: profile.hasEmergencySavings,
    has_dependent: profile.hasDependent,
  };
}

function mapRowToProfile(row: UserProfileRow): UserProfile {
  const normalized = normalizeUserProfile({
    age: row.age,
    province: row.province,
    employed: row.employed,
    student: row.student,
    renter: row.renter,
    hasCar: row.has_car,
    hasDebt: row.has_debt,
    livesWithParents: row.lives_with_parents,
    filesTaxes: row.files_taxes,
    noEmployerBenefits: row.no_employer_benefits,
    // Eligibility & context — nullable fallback to false if column doesn't exist yet in DB
    isPostSecondary: row.is_post_secondary ?? false,
    isNewcomer: row.is_newcomer ?? false,
    isIndigenous: row.is_indigenous ?? false,
    hasEmergencySavings: row.has_emergency_savings ?? false,
    hasDependent: row.has_dependent ?? false,
  });

  if (!normalized) {
    throw new Error("Invalid profile row returned from Supabase.");
  }

  return normalized;
}

export async function savePersistedUserProfile(userId: string, profile: UserProfile): Promise<UserProfile> {
  saveLocalProfileCaches(userId, profile);

  try {
    const supabase = getSupabaseBrowserClient();
    const payload = mapProfileToInsert(userId, profile);

    const { error } = await supabase.from("user_profiles").upsert(payload, { onConflict: "user_id" });

    if (error) {
      if (isMissingTableError(error) || isPermissionError(error)) {
        logSupabaseWarningOnce(
          "profile-store",
          "Profile save fell back to local cache because Supabase schema/policies are not ready",
          error
        );
        return profile;
      }

      throw error;
    }

    return profile;
  } catch (error) {
    logSupabaseError("profile-store", "Unexpected Supabase profile save failure, using local cache", error);
    return profile;
  }
}

export async function loadPersistedUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isNoRowsError(error)) {
        return null;
      }

      if (isMissingTableError(error) || isPermissionError(error)) {
        logSupabaseWarningOnce(
          "profile-store",
          "Profile load fell back to local cache because Supabase schema/policies are not ready",
          error
        );
        return loadProfileFromFallback(userId);
      }

      throw error;
    }

    if (!data) {
      return null;
    }

    const profile = mapRowToProfile(data as UserProfileRow);
    saveLocalProfileCaches(userId, profile);
    return profile;
  } catch (error) {
    logSupabaseError("profile-store", "Unexpected Supabase profile load failure, using local cache", error);
    return loadProfileFromFallback(userId);
  }
}
