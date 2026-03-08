import { NextRequest, NextResponse } from "next/server";
import { saveExtensionDecision } from "@/lib/extension/decisionHistory";
import { resolveExtensionProfile } from "@/lib/extension/profileResolver";
import { isSupportedExtensionMerchant } from "@/lib/extension/supportedMerchants";
import { analyzeSpendCheck } from "@/lib/spending/rules";
import type { AnalyzeRequest, AnalyzeResponse } from "@/types/extension";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function withCors(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
  return response;
}

function respond(payload: AnalyzeResponse, init?: ResponseInit): NextResponse {
  return withCors(NextResponse.json(payload, init));
}

function validateAnalyzeRequest(body: Partial<AnalyzeRequest>): string | null {
  if (!body.page) return "Missing `page` payload.";
  if (!body.page.url) return "Missing `page.url`.";
  if (!body.page.hostname) return "Missing `page.hostname`.";
  if (!body.page.merchant) return "Missing `page.merchant`.";
  if (!isSupportedExtensionMerchant(body.page.merchant)) {
    return `Unsupported merchant: ${body.page.merchant}.`;
  }
  if (!body.page.pageType) return "Missing `page.pageType`.";
  return null;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AnalyzeRequest>;
    const validationError = validateAnalyzeRequest(body);

    if (validationError) {
      return respond({ ok: false, error: validationError }, { status: 400 });
    }

    const typedBody = body as AnalyzeRequest;
    const profileResolution = await resolveExtensionProfile({
      userId: typedBody.userId,
      useDemoProfile: typedBody.useDemoProfile,
    });

    const analysis = analyzeSpendCheck(typedBody.page, profileResolution.profile);

    let decisionHistoryStorage: "supabase" | "local" = "local";
    try {
      const decisionPersistence = await saveExtensionDecision({
        userId: typedBody.userId ?? null,
        merchant: typedBody.page.merchant,
        pageTitle: typedBody.page.title ?? "Unknown product",
        pageUrl: typedBody.page.url,
        analysis,
      });
      decisionHistoryStorage = decisionPersistence.storage;
    } catch (persistenceError) {
      console.error("Extension decision save failed, continuing without persistence:", persistenceError);
    }

    return respond({
      ok: true,
      analysis,
      // Backward-compatible alias for existing prototype clients.
      result: analysis,
      metadata: {
        profileSource: profileResolution.source,
        mode: profileResolution.mode,
        note: profileResolution.note,
        requestedUserId: typedBody.userId ?? null,
        decisionHistoryStorage,
      },
    });
  } catch (error) {
    console.error("Extension analyze error:", error);

    return respond(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze YUTH spending context.",
      },
      { status: 500 }
    );
  }
}
