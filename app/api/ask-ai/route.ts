import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import actionsData from "@/data/actions.json";
import benefitsData from "@/data/benefits.json";
import {
  buildSystemPrompt,
  buildUserPrompt,
  extractResponseText,
  sanitizeHistory,
  sanitizeRecommendationContext,
} from "@/lib/ai/grounding";
import { loadRecentExtensionDecisions } from "@/lib/extension/decisionHistory";
import { normalizeUserProfile } from "@/lib/profile-utils";
import type { AskAIResponseBody } from "@/types/ai";
import type { ActionItem } from "@/types/action";
import type { Benefit } from "@/types/benefit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const benefitCatalog: Benefit[] = benefitsData as Benefit[];
const actionCatalog: ActionItem[] = actionsData as ActionItem[];

interface AskAIRawBody {
  userId?: unknown;
  profile?: unknown;
  recommendation?: unknown;
  question?: unknown;
  history?: unknown;
}

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: AskAIRawBody;
  try {
    body = (await request.json()) as AskAIRawBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const profile = normalizeUserProfile(body.profile);
  if (!profile) {
    return NextResponse.json({ error: "A valid user profile is required." }, { status: 400 });
  }

  const recommendation = sanitizeRecommendationContext(body.recommendation);
  const userId = typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : null;

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  if (question.length > 600) {
    return NextResponse.json({ error: "Question is too long. Please keep it under 600 characters." }, { status: 400 });
  }

  const history = sanitizeHistory(body.history);
  let extensionDecisionContext: Awaited<ReturnType<typeof loadRecentExtensionDecisions>> = {
    decisions: [],
    storage: "local",
  };

  if (userId) {
    try {
      extensionDecisionContext = await loadRecentExtensionDecisions({
        userId,
        limit: 5,
      });
    } catch (decisionError) {
      console.warn("ask-ai route could not load extension decision context:", decisionError);
    }
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_output_tokens: 450,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildSystemPrompt({
                profile,
                recommendation,
                recentExtensionDecisions: extensionDecisionContext.decisions,
              }),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildUserPrompt({
                question,
                profile,
                recommendation,
                history,
                recentExtensionDecisions: extensionDecisionContext.decisions,
                benefitCatalog,
                actionCatalog,
              }),
            },
          ],
        },
      ],
    });

    const answer = extractResponseText(response);
    if (!answer) {
      throw new Error("The model returned an empty response.");
    }

    const payload: AskAIResponseBody = {
      answer,
      metaLabel:
        extensionDecisionContext.decisions.length > 0
          ? "Based on your profile, matched programs, and recent browser decisions"
          : "Based on your profile and matched programs",
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
