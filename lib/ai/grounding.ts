import type { ActionItem } from "@/types/action";
import type { ChatHistoryMessage, RecommendationContext } from "@/types/ai";
import type { Benefit } from "@/types/benefit";
import type { ExtensionDecision } from "@/types/extension";
import type { UserProfile } from "@/types/profile";

const MAX_HISTORY_MESSAGES = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toSafeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isActionPriority(value: unknown): value is "high" | "medium" | "low" {
  return value === "high" || value === "medium" || value === "low";
}

function isChatRole(value: unknown): value is "user" | "assistant" {
  return value === "user" || value === "assistant";
}

export function sanitizeRecommendationContext(value: unknown): RecommendationContext {
  if (!isRecord(value)) {
    return {
      matchedBenefits: [],
      matchedActions: [],
      insights: [],
    };
  }

  const rawBenefits = Array.isArray(value.matchedBenefits) ? value.matchedBenefits : [];
  const rawActions = Array.isArray(value.matchedActions) ? value.matchedActions : [];
  const rawInsights = Array.isArray(value.insights) ? value.insights : [];

  const matchedBenefits = rawBenefits
    .map((benefit): RecommendationContext["matchedBenefits"][number] | null => {
      if (!isRecord(benefit)) {
        return null;
      }

      const id = toSafeString(benefit.id);
      const name = toSafeString(benefit.name);
      const description = toSafeString(benefit.description);

      if (!id || !name || !description || !isRecord(benefit.estimated_value)) {
        return null;
      }

      const min = benefit.estimated_value.min;
      const max = benefit.estimated_value.max;
      const display = toSafeString(benefit.estimated_value.display);
      const sourceLabel = toSafeString(benefit.sourceLabel) ?? undefined;
      const sourceUrl = toSafeString(benefit.sourceUrl) ?? undefined;

      if (!isFiniteNumber(min) || !isFiniteNumber(max) || !display) {
        return null;
      }

      return {
        id,
        name,
        description,
        estimated_value: {
          min,
          max,
          display,
        },
        sourceLabel,
        sourceUrl,
      };
    })
    .filter((benefit): benefit is RecommendationContext["matchedBenefits"][number] => Boolean(benefit));

  const matchedActions = rawActions
    .map((action): RecommendationContext["matchedActions"][number] | null => {
      if (!isRecord(action)) {
        return null;
      }

      const id = toSafeString(action.id);
      const title = toSafeString(action.title);
      const description = toSafeString(action.description);
      const priority = toSafeString(action.priority);
      const sourceLabel = toSafeString(action.sourceLabel) ?? undefined;
      const sourceUrl = toSafeString(action.sourceUrl) ?? undefined;
      const externalLink = toSafeString(action.externalLink) ?? undefined;
      const externalLinkLabel = toSafeString(action.externalLinkLabel) ?? undefined;

      if (!id || !title || !description || !isActionPriority(priority)) {
        return null;
      }

      return {
        id,
        title,
        description,
        priority,
        sourceLabel,
        sourceUrl,
        externalLink,
        externalLinkLabel,
      };
    })
    .filter((action): action is RecommendationContext["matchedActions"][number] => Boolean(action));

  const insights = rawInsights
    .map((insight) => toSafeString(insight))
    .filter((insight): insight is string => Boolean(insight))
    .slice(0, 4);

  let estimatedValueRange: RecommendationContext["estimatedValueRange"] | undefined;
  if (isRecord(value.estimatedValueRange)) {
    const min = value.estimatedValueRange.min;
    const max = value.estimatedValueRange.max;
    const label = toSafeString(value.estimatedValueRange.label);

    if (isFiniteNumber(min) && isFiniteNumber(max) && label) {
      estimatedValueRange = { min, max, label };
    }
  }

  let estimatedValueTotal: number | undefined;
  if (isFiniteNumber(value.estimatedValueTotal)) {
    estimatedValueTotal = value.estimatedValueTotal;
  }

  let topInsight: RecommendationContext["topInsight"];
  if (isRecord(value.topInsight)) {
    const title = toSafeString(value.topInsight.title);
    const body = toSafeString(value.topInsight.body);
    const sourceLabel = toSafeString(value.topInsight.sourceLabel) ?? undefined;
    const sourceUrl = toSafeString(value.topInsight.sourceUrl) ?? undefined;

    if (title && body) {
      topInsight = {
        title,
        body,
        sourceLabel,
        sourceUrl,
      };
    }
  }

  let adultScore: RecommendationContext["adultScore"];
  if (isRecord(value.adultScore)) {
    const score = value.adultScore.score;
    const tier = toSafeString(value.adultScore.tier);
    const completedActions = value.adultScore.completedActions;
    const totalActions = value.adultScore.totalActions;

    if (isFiniteNumber(score) && tier && isFiniteNumber(completedActions) && isFiniteNumber(totalActions)) {
      adultScore = {
        score,
        tier,
        completedActions,
        totalActions,
      };
    }
  }

  return {
    matchedBenefits,
    matchedActions,
    estimatedValueRange,
    estimatedValueTotal,
    insights,
    topInsight,
    adultScore,
  };
}

export function sanitizeHistory(value: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((message): ChatHistoryMessage | null => {
      if (!isRecord(message)) {
        return null;
      }

      const role = toSafeString(message.role);
      const content = toSafeString(message.content);

      if (!isChatRole(role) || !content) {
        return null;
      }

      return { role, content };
    })
    .filter((message): message is ChatHistoryMessage => Boolean(message))
    .slice(-MAX_HISTORY_MESSAGES);
}

interface SystemPromptInput {
  profile: UserProfile;
  recommendation: RecommendationContext;
  recentExtensionDecisions: ExtensionDecision[];
}

export function buildSystemPrompt(input: SystemPromptInput): string {
  const systemContext = {
    profile: input.profile,
    top_insight: input.recommendation.topInsight ?? null,
    adult_score: input.recommendation.adultScore ?? null,
    recent_extension_decisions: input.recentExtensionDecisions.slice(0, 5).map((decision) => ({
      merchant: decision.merchant,
      page_title: decision.pageTitle,
      recommendation: decision.recommendation,
      purchase_amount: decision.purchaseAmount,
      detected_category: decision.detectedCategory,
      deadline_risk: decision.deadlineRisk,
      goal_impact: decision.goalImpact,
      created_at: decision.createdAt,
    })),
  };

  return [
    "You are YUTH AI, a Canadian adulthood assistant for young adults.",
    "Answer using ONLY the provided YUTH context and allowed program catalog.",
    "Do not invent benefits, tax credits, grants, or actions that are not in the provided catalog.",
    "If context is incomplete, state uncertainty and provide practical next steps.",
    "Do not provide legal or tax guarantees; use cautious language like 'may', 'could', or 'typically'.",
    "Use a calm, practical fintech/govtech tone.",
    "Keep the response concise: one short paragraph plus optional next-step bullets (max 4 bullets).",
    "Treat the following user profile context as mandatory personalization input.",
    JSON.stringify(systemContext, null, 2),
  ].join("\n\n");
}

interface UserPromptInput {
  question: string;
  profile: UserProfile;
  recommendation: RecommendationContext;
  history: ChatHistoryMessage[];
  recentExtensionDecisions: ExtensionDecision[];
  benefitCatalog: Benefit[];
  actionCatalog: ActionItem[];
}

export function buildUserPrompt(input: UserPromptInput): string {
  const payload = {
    user_question: input.question,
    user_profile: input.profile,
    matched_benefits: input.recommendation.matchedBenefits.map((benefit) => ({
      id: benefit.id,
      name: benefit.name,
      description: benefit.description,
      estimated_value: benefit.estimated_value.display,
      source_label: benefit.sourceLabel,
      source_url: benefit.sourceUrl,
    })),
    matched_actions: input.recommendation.matchedActions.map((action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      priority: action.priority,
      source_label: action.sourceLabel,
      source_url: action.sourceUrl,
      external_link: action.externalLink,
      external_link_label: action.externalLinkLabel,
    })),
    estimated_value_range: input.recommendation.estimatedValueRange?.label,
    adult_score: input.recommendation.adultScore,
    top_insight: input.recommendation.topInsight,
    recommendation_insights: input.recommendation.insights ?? [],
    recent_extension_decisions: input.recentExtensionDecisions.slice(0, 5).map((decision) => ({
      merchant: decision.merchant,
      page_title: decision.pageTitle,
      page_url: decision.pageUrl,
      recommendation: decision.recommendation,
      purchase_amount: decision.purchaseAmount,
      detected_category: decision.detectedCategory,
      deadline_risk: decision.deadlineRisk,
      goal_impact: decision.goalImpact,
      created_at: decision.createdAt,
    })),
    recent_chat_history: input.history,
    allowed_benefit_catalog: input.benefitCatalog.map((benefit) => ({
      id: benefit.id,
      name: benefit.name,
      source_label: benefit.sourceLabel,
    })),
    allowed_action_catalog: input.actionCatalog.map((action) => ({
      id: action.id,
      title: action.title,
      source_label: action.sourceLabel,
    })),
  };

  return [
    "Use the following JSON context to answer the user question.",
    "When relevant, reference matched benefits/actions by name and suggest practical next steps.",
    "Context:",
    JSON.stringify(payload, null, 2),
  ].join("\n\n");
}

export function extractResponseText(value: unknown): string {
  if (isRecord(value)) {
    const outputText = value.output_text;
    if (typeof outputText === "string" && outputText.trim()) {
      return outputText.trim();
    }

    const output = value.output;
    if (Array.isArray(output)) {
      const textParts: string[] = [];

      for (const outputItem of output) {
        if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
          continue;
        }

        for (const contentItem of outputItem.content) {
          if (!isRecord(contentItem)) {
            continue;
          }

          const text = contentItem.text;
          if (typeof text === "string" && text.trim()) {
            textParts.push(text.trim());
          }
        }
      }

      if (textParts.length > 0) {
        return textParts.join("\n").trim();
      }
    }
  }

  return "";
}
