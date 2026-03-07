import { NextRequest, NextResponse } from "next/server";
import demoProfile from "@/lib/data/spendingProfile.json";
import type { AnalyzeRequest } from "@/types/extension";
import type { SpendingProfile } from "@/types/spending";
import { analyzeSpendCheck } from "@/lib/spending/rules";

function validateRequest(body: Partial<AnalyzeRequest>): string | null {
  if (!body.page) return "Missing page object.";
  if (!body.page.url) return "Missing page.url.";
  if (!body.page.hostname) return "Missing page.hostname.";
  if (!body.page.merchant) return "Missing page.merchant.";
  if (!body.page.pageType) return "Missing page.pageType.";
  return null;
}

// Replace this later with Supabase or your real user profile loader.
async function loadProfile(body: AnalyzeRequest): Promise<SpendingProfile> {
  if (body.useDemoProfile !== false) {
    return demoProfile as SpendingProfile;
  }

  // Placeholder for real DB lookup:
  // const profile = await getProfileFromSupabase(body.userId)
  // return profile

  return demoProfile as SpendingProfile;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AnalyzeRequest>;
    const validationError = validateRequest(body);

    if (validationError) {
      return NextResponse.json(
        { ok: false, error: validationError },
        { status: 400 }
      );
    }

    const typedBody = body as AnalyzeRequest;
    const profile = await loadProfile(typedBody);
    const result = analyzeSpendCheck(typedBody.page, profile);

    return NextResponse.json({
      ok: true,
      result
    });
  } catch (error) {
    console.error("Extension analyze error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to analyze spending context."
      },
      { status: 500 }
    );
  }
}