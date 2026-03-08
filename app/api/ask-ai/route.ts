import { NextRequest, NextResponse } from "next/server";
import { normalizeUserProfile } from "@/lib/profile-utils";
import type { AskAIResponseBody } from "@/types/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AskAIRawBody {
  userId?: unknown;
  profile?: unknown;
  recommendation?: unknown;
  question?: unknown;
  history?: unknown;
}

export async function POST(request: NextRequest) {
  let body: AskAIRawBody;

  try {
    body = (await request.json()) as AskAIRawBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!userId) {
    return NextResponse.json({ error: "A valid userId is required." }, { status: 400 });
  }

  const profile = normalizeUserProfile(body.profile);
  if (!profile) {
    return NextResponse.json({ error: "A valid user profile is required." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  if (question.length > 600) {
    return NextResponse.json(
      { error: "Question is too long. Please keep it under 600 characters." },
      { status: 400 }
    );
  }

  try {
    // Ensure user thread exists
    await fetch("http://127.0.0.1:8000/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    // Send chat message to FastAPI backend
    const backendResponse = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        message: question,
      }),
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok || !data || typeof data.response !== "string") {
      throw new Error(data?.error || "Backend returned an invalid response.");
    }

    const payload: AskAIResponseBody = {
      answer: data.response.trim(),
      metaLabel: "Based on your saved profile and conversation",
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("ask-ai route failed", error);

    return NextResponse.json(
      {
        error: "I could not generate a personalized answer right now. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}