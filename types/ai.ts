import type { ActionPriority } from "./action";
import type { EstimatedValue } from "./benefit";
import type { UserProfile } from "./profile";

export type ChatRole = "user" | "assistant";

export interface ChatHistoryMessage {
  role: ChatRole;
  content: string;
}

export interface RecommendationContext {
  matchedBenefits: Array<{
    id: string;
    name: string;
    description: string;
    estimated_value: EstimatedValue;
    sourceLabel?: string;
    sourceUrl?: string;
  }>;
  matchedActions: Array<{
    id: string;
    title: string;
    description: string;
    priority: ActionPriority;
    sourceLabel?: string;
    sourceUrl?: string;
    externalLink?: string;
    externalLinkLabel?: string;
  }>;
  estimatedValueRange?: {
    min: number;
    max: number;
    label: string;
  };
  estimatedValueTotal?: number;
  insights?: string[];
}

export interface AskAIRequestBody {
  profile: UserProfile;
  recommendation: RecommendationContext;
  question: string;
  history?: ChatHistoryMessage[];
}

export interface AskAIResponseBody {
  answer: string;
  metaLabel: string;
}
