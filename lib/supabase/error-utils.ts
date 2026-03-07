import type { AuthError, PostgrestError } from "@supabase/supabase-js";

export interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
}

type MaybeSupabaseError = PostgrestError | AuthError | SupabaseErrorLike;

const warnedMessages = new Set<string>();

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function toSupabaseErrorLike(error: unknown): SupabaseErrorLike {
  if (!error || typeof error !== "object") {
    return {
      message: typeof error === "string" ? error : "Unknown error",
    };
  }

  const maybeError = error as MaybeSupabaseError;
  const code = getString(maybeError.code);
  const message = getString(maybeError.message);
  const details = getString((maybeError as { details?: string }).details);
  const hint = getString((maybeError as { hint?: string }).hint);
  const status = typeof (maybeError as { status?: number }).status === "number"
    ? (maybeError as { status?: number }).status
    : undefined;

  return { code, message, details, hint, status };
}

export function isNoRowsError(error: unknown): boolean {
  const normalized = toSupabaseErrorLike(error);
  const message = (normalized.message ?? "").toLowerCase();

  return (
    normalized.code === "PGRST116" ||
    message.includes("0 rows") ||
    message.includes("no rows") ||
    message.includes("json object requested")
  );
}

export function isMissingTableError(error: unknown): boolean {
  const normalized = toSupabaseErrorLike(error);
  const message = (normalized.message ?? "").toLowerCase();

  return normalized.code === "42P01" || (message.includes("relation") && message.includes("does not exist"));
}

export function isPermissionError(error: unknown): boolean {
  const normalized = toSupabaseErrorLike(error);
  const message = (normalized.message ?? "").toLowerCase();

  return (
    normalized.code === "42501" ||
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("rls")
  );
}

export function formatSupabaseError(error: unknown): string {
  const normalized = toSupabaseErrorLike(error);

  const parts = [
    normalized.code ? `code=${normalized.code}` : null,
    normalized.status !== undefined ? `status=${normalized.status}` : null,
    normalized.message ? `message=${normalized.message}` : null,
    normalized.details ? `details=${normalized.details}` : null,
    normalized.hint ? `hint=${normalized.hint}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" | ") : "Unknown Supabase error";
}

export function logSupabaseWarningOnce(scope: string, message: string, error: unknown): void {
  const detail = formatSupabaseError(error);
  const cacheKey = `${scope}:${message}:${detail}`;

  if (warnedMessages.has(cacheKey)) {
    return;
  }

  warnedMessages.add(cacheKey);
  console.warn(`[${scope}] ${message} (${detail})`);
}

export function logSupabaseError(scope: string, message: string, error: unknown): void {
  const detail = formatSupabaseError(error);
  console.error(`[${scope}] ${message} (${detail})`);
}
