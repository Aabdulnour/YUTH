import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const documentId = typeof body.documentId === "string" ? body.documentId.trim() : "";
    const folderId =
      typeof body.folderId === "string" ? body.folderId.trim() : body.folderId === null ? null : "";

    if (!userId || !documentId || folderId === "") {
      return NextResponse.json(
        { error: "userId and documentId are required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/documents/move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        document_id: documentId,
        folder_id: folderId,
      }),
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Move failed." },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Move route failed:", error);
    return NextResponse.json({ error: "Move failed." }, { status: 500 });
  }
}