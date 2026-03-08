import "server-only";

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isMissingTableError,
  isPermissionError,
  logSupabaseError,
  logSupabaseWarningOnce,
} from "@/lib/supabase/error-utils";
import type {
  AnalyzeResult,
  ExtensionDecision,
  ExtensionDecisionStorageMode,
  Recommendation,
} from "@/types/extension";

const DECISION_HISTORY_FILE = path.join(os.tmpdir(), "maplemind-extension-decisions.json");
const MAX_LOCAL_DECISIONS = 500;

interface ExtensionDecisionRow {
  id: string;
  user_id: string | null;
  merchant: string;
  page_title: string;
  page_url: string;
  recommendation: Recommendation;
  purchase_amount: number;
  detected_category: string;
  deadline_risk: AnalyzeResult["deadlineRisk"];
  goal_impact: AnalyzeResult["goalImpact"];
  created_at: string;
}

export interface SaveExtensionDecisionInput {
  userId?: string | null;
  merchant: string;
  pageTitle: string;
  pageUrl: string;
  analysis: AnalyzeResult;
}

export interface LoadRecentExtensionDecisionsInput {
  userId?: string | null;
  limit?: number;
}

function createDecisionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `decision-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeLimit(limit?: number): number {
  if (!Number.isFinite(limit)) {
    return 5;
  }

  return Math.min(Math.max(Math.trunc(limit as number), 1), 20);
}

function normalizeRecommendation(value: unknown): Recommendation {
  if (
    value === "buy_now" ||
    value === "wait" ||
    value === "find_cheaper_option" ||
    value === "save_for_later" ||
    value === "review_budget"
  ) {
    return value;
  }

  return "review_budget";
}

function normalizeDeadlineRisk(value: unknown): AnalyzeResult["deadlineRisk"] {
  if (value === "none" || value === "watch" || value === "high") {
    return value;
  }

  return "none";
}

function normalizeGoalImpact(value: unknown): AnalyzeResult["goalImpact"] {
  if (value === "positive" || value === "neutral" || value === "negative") {
    return value;
  }

  return "neutral";
}

function mapRowToDecision(row: ExtensionDecisionRow): ExtensionDecision {
  return {
    id: row.id,
    userId: row.user_id,
    merchant: row.merchant,
    pageTitle: row.page_title,
    pageUrl: row.page_url,
    recommendation: row.recommendation,
    purchaseAmount: row.purchase_amount,
    detectedCategory: row.detected_category,
    deadlineRisk: row.deadline_risk,
    goalImpact: row.goal_impact,
    createdAt: row.created_at,
  };
}

function mapUnknownToRow(value: unknown): ExtensionDecisionRow | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;

  const id = typeof row.id === "string" ? row.id : createDecisionId();
  const userId = typeof row.user_id === "string" ? row.user_id : null;
  const merchant = typeof row.merchant === "string" ? row.merchant : null;
  const pageTitle = typeof row.page_title === "string" ? row.page_title : null;
  const pageUrl = typeof row.page_url === "string" ? row.page_url : null;
  const purchaseAmount = typeof row.purchase_amount === "number" ? row.purchase_amount : null;
  const detectedCategory = typeof row.detected_category === "string" ? row.detected_category : null;
  const createdAt = typeof row.created_at === "string" ? row.created_at : new Date().toISOString();

  if (!merchant || !pageTitle || !pageUrl || purchaseAmount === null || !detectedCategory) {
    return null;
  }

  return {
    id,
    user_id: userId,
    merchant,
    page_title: pageTitle,
    page_url: pageUrl,
    recommendation: normalizeRecommendation(row.recommendation),
    purchase_amount: purchaseAmount,
    detected_category: detectedCategory,
    deadline_risk: normalizeDeadlineRisk(row.deadline_risk),
    goal_impact: normalizeGoalImpact(row.goal_impact),
    created_at: createdAt,
  };
}

function buildRowFromInput(input: SaveExtensionDecisionInput): ExtensionDecisionRow {
  const now = new Date().toISOString();

  return {
    id: createDecisionId(),
    user_id: input.userId ?? null,
    merchant: input.merchant,
    page_title: input.pageTitle.trim().slice(0, 240) || "Unknown product",
    page_url: input.pageUrl,
    recommendation: input.analysis.recommendation,
    purchase_amount: input.analysis.purchaseAmount,
    detected_category: input.analysis.detectedCategory,
    deadline_risk: input.analysis.deadlineRisk,
    goal_impact: input.analysis.goalImpact,
    created_at: now,
  };
}

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function readLocalDecisionRows(): Promise<ExtensionDecisionRow[]> {
  try {
    const rawValue = await fs.readFile(DECISION_HISTORY_FILE, "utf8");
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => mapUnknownToRow(entry))
      .filter((entry): entry is ExtensionDecisionRow => Boolean(entry));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    console.warn("[extension-decision-history] Could not read local decision history file.", error);
    return [];
  }
}

async function writeLocalDecisionRows(rows: ExtensionDecisionRow[]): Promise<void> {
  const sortedRows = [...rows]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, MAX_LOCAL_DECISIONS);

  await fs.mkdir(path.dirname(DECISION_HISTORY_FILE), { recursive: true });
  await fs.writeFile(DECISION_HISTORY_FILE, JSON.stringify(sortedRows, null, 2), "utf8");
}

async function saveToLocalHistory(row: ExtensionDecisionRow): Promise<ExtensionDecision> {
  const currentRows = await readLocalDecisionRows();
  await writeLocalDecisionRows([row, ...currentRows]);
  return mapRowToDecision(row);
}

async function loadFromLocalHistory(input: LoadRecentExtensionDecisionsInput): Promise<ExtensionDecision[]> {
  const limit = normalizeLimit(input.limit);
  const rows = await readLocalDecisionRows();

  const filteredRows =
    input.userId && input.userId.trim()
      ? rows.filter((row) => row.user_id === input.userId)
      : rows;

  return filteredRows.slice(0, limit).map(mapRowToDecision);
}

async function saveToSupabaseHistory(row: ExtensionDecisionRow): Promise<ExtensionDecision | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const insertPayload = {
    user_id: row.user_id,
    merchant: row.merchant,
    page_title: row.page_title,
    page_url: row.page_url,
    recommendation: row.recommendation,
    purchase_amount: row.purchase_amount,
    detected_category: row.detected_category,
    deadline_risk: row.deadline_risk,
    goal_impact: row.goal_impact,
    created_at: row.created_at,
  };

  const { data, error } = await supabase
    .from("extension_decisions")
    .insert(insertPayload)
    .select(
      "id,user_id,merchant,page_title,page_url,recommendation,purchase_amount,detected_category,deadline_risk,goal_impact,created_at"
    )
    .single();

  if (error) {
    if (isMissingTableError(error) || isPermissionError(error)) {
      logSupabaseWarningOnce(
        "extension-decision-history",
        "Supabase extension decision save is unavailable; using local fallback",
        error
      );
      return null;
    }

    logSupabaseError("extension-decision-history", "Unexpected extension decision save failure", error);
    return null;
  }

  const normalizedRow = mapUnknownToRow(data);
  return normalizedRow ? mapRowToDecision(normalizedRow) : mapRowToDecision(row);
}

async function loadFromSupabaseHistory(
  input: LoadRecentExtensionDecisionsInput
): Promise<ExtensionDecision[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const limit = normalizeLimit(input.limit);

  let query = supabase
    .from("extension_decisions")
    .select(
      "id,user_id,merchant,page_title,page_url,recommendation,purchase_amount,detected_category,deadline_risk,goal_impact,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (input.userId && input.userId.trim()) {
    query = query.eq("user_id", input.userId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error) || isPermissionError(error)) {
      logSupabaseWarningOnce(
        "extension-decision-history",
        "Supabase extension decision load is unavailable; using local fallback",
        error
      );
      return null;
    }

    logSupabaseError("extension-decision-history", "Unexpected extension decision load failure", error);
    return null;
  }

  return (data ?? [])
    .map((row) => mapUnknownToRow(row))
    .filter((row): row is ExtensionDecisionRow => Boolean(row))
    .map(mapRowToDecision);
}

export async function saveExtensionDecision(input: SaveExtensionDecisionInput): Promise<{
  decision: ExtensionDecision;
  storage: ExtensionDecisionStorageMode;
}> {
  const row = buildRowFromInput(input);
  const supabaseDecision = await saveToSupabaseHistory(row);

  if (supabaseDecision) {
    return {
      decision: supabaseDecision,
      storage: "supabase",
    };
  }

  const localDecision = await saveToLocalHistory(row);
  return {
    decision: localDecision,
    storage: "local",
  };
}

export async function loadRecentExtensionDecisions(input: LoadRecentExtensionDecisionsInput): Promise<{
  decisions: ExtensionDecision[];
  storage: ExtensionDecisionStorageMode;
}> {
  const supabaseDecisions = await loadFromSupabaseHistory(input);
  if (supabaseDecisions) {
    return {
      decisions: supabaseDecisions,
      storage: "supabase",
    };
  }

  const localDecisions = await loadFromLocalHistory(input);
  return {
    decisions: localDecisions,
    storage: "local",
  };
}
