import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("user_id")?.trim();

    if (!userId) {
      return NextResponse.json({ error: "A valid user_id is required." }, { status: 400 });
    }

    const backendResponse = await fetch(
      `${BACKEND_URL}/documents?user_id=${encodeURIComponent(userId)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Could not load documents." },
        { status: backendResponse.status || 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("documents list route failed", error);
    return NextResponse.json(
      { error: "Could not load documents right now." },
      { status: 500 }
    );
  }
}