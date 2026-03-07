import { NextRequest, NextResponse } from "next/server";
import demoProfile from "@/lib/data/spendingProfile.json";
import type { AnalyzeRequest } from "@/types/extension";
import type { SpendingProfile } from "@/types/spending";
import { analyzeSpendCheck } from "@/lib/spending/rules";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

function validateRequest(body: Partial<AnalyzeRequest>): string | null {
  if (!body.page) return "Missing page object.";
  if (!body.page.url) return "Missing page.url.";
  if (!body.page.hostname) return "Missing page.hostname.";
  if (!body.page.merchant) return "Missing page.merchant.";
  if (!body.page.pageType) return "Missing page.pageType.";
  return null;
}

async function loadProfile(body: AnalyzeRequest): Promise<SpendingProfile> {
  if (body.useDemoProfile !== false) {
    return demoProfile as SpendingProfile;
  }

  return demoProfile as SpendingProfile;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AnalyzeRequest>;
    const validationError = validateRequest(body);

    if (validationError) {
      return withCors(
        NextResponse.json(
          { ok: false, error: validationError },
          { status: 400 }
        )
      );
    }

    const typedBody = body as AnalyzeRequest;
    const profile = await loadProfile(typedBody);
    const result = analyzeSpendCheck(typedBody.page, profile);

    return withCors(
      NextResponse.json({
        ok: true,
        result
      })
    );
  } catch (error) {
    console.error("Extension analyze error:", error);

    return withCors(
      NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Failed to analyze spending context."
        },
        { status: 500 }
      )
    );
  }
}