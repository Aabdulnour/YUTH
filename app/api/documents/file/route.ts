import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("user_id")?.trim();
    const documentId = request.nextUrl.searchParams.get("document_id")?.trim();

    if (!userId || !documentId) {
      return NextResponse.json(
        { error: "user_id and document_id are required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(
      `${BACKEND_URL}/documents/file?user_id=${encodeURIComponent(userId)}&document_id=${encodeURIComponent(documentId)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!backendResponse.ok) {
      const data = await backendResponse.json().catch(() => null);
      return NextResponse.json(
        { error: data?.error ?? "Could not open document." },
        { status: backendResponse.status || 500 }
      );
    }

    const contentType = backendResponse.headers.get("content-type") ?? "application/octet-stream";
    const contentDisposition = backendResponse.headers.get("content-disposition") ?? "";
    const fileBuffer = await backendResponse.arrayBuffer();

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("document file route failed", error);
    return NextResponse.json({ error: "Could not open document." }, { status: 500 });
  }
}