import { NextRequest, NextResponse } from "next/server";
import type { AskAIResponseBody } from "@/types/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

interface AskAIRawBody {
  userId?: unknown;
  question?: unknown;
  matchCount?: unknown;
}

export async function POST(request: NextRequest) {
  let body: AskAIRawBody;

  try {
    body = (await request.json()) as AskAIRawBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const matchCount =
    typeof body.matchCount === "number" && Number.isFinite(body.matchCount)
      ? body.matchCount
      : 5;

  if (!userId) {
    return NextResponse.json({ error: "A valid userId is required." }, { status: 400 });
  }

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
    const backendResponse = await fetch(`${BACKEND_URL}/ask-ai-hybrid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        question,
        match_count: matchCount,
      }),
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok || !data || typeof data !== "object") {
      throw new Error(
        data && "error" in data && typeof data.error === "string"
          ? data.error
          : "Backend returned an invalid response."
      );
    }

    if ("error" in data && typeof data.error === "string") {
      throw new Error(data.error);
    }

    if (!("answer" in data) || typeof data.answer !== "string") {
      throw new Error("Backend did not return an answer.");
    }

    const payload: AskAIResponseBody = {
      answer: data.answer.trim(),
      metaLabel:
        "meta_label" in data && typeof data.meta_label === "string"
          ? data.meta_label
          : "Based on your uploaded documents, saved profile, and conversation",
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("ask-ai route failed", error);

    return NextResponse.json(
      {
        error: "I could not generate a Yuth answer right now.",
      },
      { status: 500 }
    );
  }
}