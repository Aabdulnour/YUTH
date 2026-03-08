import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const documentId = typeof body.documentId === "string" ? body.documentId.trim() : "";

    if (!userId || !documentId) {
      return NextResponse.json(
        { error: "userId and documentId are required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/documents/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        document_id: documentId,
      }),
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok || !data || typeof data !== "object") {
      return NextResponse.json(
        { error: data?.error ?? "Could not delete document." },
        { status: backendResponse.status || 500 }
      );
    }

    if ("error" in data && typeof data.error === "string") {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("documents delete route failed", error);
    return NextResponse.json({ error: "Could not delete document." }, { status: 500 });
  }
}