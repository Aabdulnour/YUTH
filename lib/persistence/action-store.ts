import {
  isMissingTableError,
  isPermissionError,
  logSupabaseError,
  logSupabaseWarningOnce,
} from "@/lib/supabase/error-utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const ACTION_STORAGE_KEY_PREFIX = "maplemind_user_actions_v1";

export type ActionCompletionMap = Record<string, boolean>;
interface ActionCompletionRow {
  action_id: string;
  completed: boolean;
}

function getLocalStorageKey(userId: string): string {
  return `${ACTION_STORAGE_KEY_PREFIX}:${userId}`;
}

function loadLocalCompletionMap(userId: string): ActionCompletionMap {
  if (typeof window === "undefined") {
    return {};
  }

  const rawValue = localStorage.getItem(getLocalStorageKey(userId));
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as ActionCompletionMap;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, boolean] => typeof entry[0] === "string" && typeof entry[1] === "boolean"
      )
    );
  } catch {
    return {};
  }
}

function saveLocalCompletionMap(userId: string, completionMap: ActionCompletionMap): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(completionMap));
}

export async function loadPersistedActionCompletion(userId: string): Promise<ActionCompletionMap> {
  try {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("user_actions")
      .select("action_id,completed")
      .eq("user_id", userId);

    if (error) {
      if (isMissingTableError(error) || isPermissionError(error)) {
        logSupabaseWarningOnce(
          "action-store",
          "Action load fell back to local cache because Supabase schema/policies are not ready",
          error
        );
        return loadLocalCompletionMap(userId);
      }

      throw error;
    }

    const rows = (data ?? []) as ActionCompletionRow[];

    const completionMap = rows.reduce<ActionCompletionMap>((accumulator, row) => {
      accumulator[row.action_id] = row.completed;
      return accumulator;
    }, {});

    saveLocalCompletionMap(userId, completionMap);
    return completionMap;
  } catch (error) {
    logSupabaseError("action-store", "Unexpected action-load failure, using local cache", error);
    return loadLocalCompletionMap(userId);
  }
}

export async function setPersistedActionCompletion(
  userId: string,
  actionId: string,
  completed: boolean
): Promise<void> {
  const currentMap = loadLocalCompletionMap(userId);
  const nextMap: ActionCompletionMap = {
    ...currentMap,
    [actionId]: completed,
  };

  saveLocalCompletionMap(userId, nextMap);

  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.from("user_actions").upsert(
    {
      user_id: userId,
      action_id: actionId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,action_id" }
  );

  if (!error) {
    return;
  }

  if (isMissingTableError(error) || isPermissionError(error)) {
    logSupabaseWarningOnce(
      "action-store",
      "Action save failed because Supabase schema/policies are not ready",
      error
    );
    throw new Error("Action progress could not be saved to Supabase.");
  }

  logSupabaseError("action-store", "Unexpected action-save failure", error);
  throw error;
}
