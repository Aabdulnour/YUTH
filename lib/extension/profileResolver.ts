import demoProfile from "@/lib/data/spendingProfile.json";
import type { ExtensionProfileSource } from "@/types/extension";
import type { SpendingProfile } from "@/types/spending";

export interface ExtensionProfileResolution {
  profile: SpendingProfile;
  source: ExtensionProfileSource;
  mode: "preview" | "live";
  note: string;
}

async function loadAuthenticatedProfile(
  userId: string
): Promise<SpendingProfile | null> {
  // Future seam: replace with real server-side profile loading tied to extension auth/session.
  // For this sprint we intentionally keep preview mode to avoid heavy auth coupling.
  void userId;
  return null;
}

export async function resolveExtensionProfile(input: {
  userId?: string;
  useDemoProfile?: boolean;
}): Promise<ExtensionProfileResolution> {
  const requestedLiveProfile = input.useDemoProfile === false;
  const hasUserId = Boolean(input.userId);

  if (requestedLiveProfile && hasUserId) {
    const profile = await loadAuthenticatedProfile(input.userId as string);
    if (profile) {
      return {
        profile,
        source: "authenticated_user_profile",
        mode: "live",
        note: "Using your YUTH profile.",
      };
    }
  }

  const fallbackNote = requestedLiveProfile
    ? "Preview mode: authenticated extension profile sync is not wired yet, so YUTH is using a demo spending profile."
    : "Preview mode: YUTH is using a demo spending profile for extension analysis.";

  return {
    profile: demoProfile as SpendingProfile,
    source: "demo_profile",
    mode: "preview",
    note: fallbackNote,
  };
}
