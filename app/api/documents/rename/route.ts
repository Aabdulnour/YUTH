import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const documentId = typeof body.documentId === "string" ? body.documentId.trim() : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";

    if (!userId || !documentId || !displayName) {
      return NextResponse.json(
        { error: "userId, documentId and displayName are required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/documents/rename`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        document_id: documentId,
        display_name: displayName,
      }),
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Rename failed." },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Rename route failed:", error);
    return NextResponse.json({ error: "Rename failed." }, { status: 500 });
  }
}