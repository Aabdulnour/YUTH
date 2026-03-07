import type { ProfileMatchConditions } from "./profile";

export type ActionPriority = "high" | "medium" | "low";

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  tags?: string[];
  conditions?: ProfileMatchConditions;
  externalLink?: string;
}
