import { NextRequest, NextResponse } from "next/server";
import { loadRecentExtensionDecisions } from "@/lib/extension/decisionHistory";
import type { ExtensionDecisionsResponse } from "@/types/extension";

function withCors(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return response;
}

function respond(payload: ExtensionDecisionsResponse, init?: ResponseInit): NextResponse {
  return withCors(NextResponse.json(payload, init));
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 5);

    if (!userId || !userId.trim()) {
      return respond({
        ok: true,
        decisions: [],
        storage: "local",
      });
    }

    const result = await loadRecentExtensionDecisions({
      userId: userId.trim(),
      limit: Number.isFinite(rawLimit) ? rawLimit : 5,
    });

    return respond({
      ok: true,
      decisions: result.decisions,
      storage: result.storage,
    });
  } catch (error) {
    console.error("Extension decisions route failed:", error);

    return respond(
      {
        ok: false,
        decisions: [],
        storage: "local",
        error: "Could not load recent extension decisions.",
      },
      { status: 500 }
    );
  }
}
