import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const userId = formData.get("user_id");
    const file = formData.get("file");

    if (typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json({ error: "A valid user_id is required." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append("user_id", userId);

    const folderName = formData.get("folder_name");
    if (typeof folderName === "string" && folderName.trim()) {
      backendFormData.append("folder_name", folderName.trim());
    }

    const displayName = formData.get("display_name");
    if (typeof displayName === "string" && displayName.trim()) {
      backendFormData.append("display_name", displayName.trim());
    }

    backendFormData.append("file", file);

    const backendResponse = await fetch(`${BACKEND_URL}/documents/upload`, {
      method: "POST",
      body: backendFormData,
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok || !data || typeof data !== "object") {
      return NextResponse.json(
        { error: data?.error ?? "Upload failed." },
        { status: backendResponse.status || 500 }
      );
    }

    if ("error" in data && typeof data.error === "string") {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("documents upload route failed", error);
    return NextResponse.json(
      { error: "Could not upload the file right now." },
      { status: 500 }
    );
  }
}