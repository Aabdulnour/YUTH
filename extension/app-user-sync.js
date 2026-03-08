const EXTENSION_USER_ID_KEY = "maplemindLinkedUserId";
const EXTENSION_USER_SYNCED_AT_KEY = "maplemindLinkedUserSyncedAt";

function findUserIdInValue(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const nestedId = findUserIdInValue(entry, depth + 1);
      if (nestedId) {
        return nestedId;
      }
    }

    return null;
  }

  const record = value;

  if (
    typeof record?.user === "object" &&
    record.user !== null &&
    typeof record.user.id === "string" &&
    record.user.id
  ) {
    return record.user.id;
  }

  for (const nestedValue of Object.values(record)) {
    const nestedId = findUserIdInValue(nestedValue, depth + 1);
    if (nestedId) {
      return nestedId;
    }
  }

  return null;
}

function getMapleMindUserIdFromLocalStorage() {
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) {
        continue;
      }

      const rawValue = localStorage.getItem(key);
      if (!rawValue) {
        continue;
      }

      try {
        const parsed = JSON.parse(rawValue);
        const userId = findUserIdInValue(parsed);
        if (userId) {
          return userId;
        }
      } catch {
        // Ignore malformed values and continue searching.
      }
    }
  } catch (error) {
    console.warn("[YUTH extension] Could not read auth token from localStorage.", error);
  }

  return null;
}

async function syncMapleMindUserToExtensionStorage() {
  const userId = getMapleMindUserIdFromLocalStorage();

  if (userId) {
    await chrome.storage.local.set({
      [EXTENSION_USER_ID_KEY]: userId,
      [EXTENSION_USER_SYNCED_AT_KEY]: new Date().toISOString(),
    });
    return;
  }

  await chrome.storage.local.remove([EXTENSION_USER_ID_KEY, EXTENSION_USER_SYNCED_AT_KEY]);
}

window.addEventListener("load", () => {
  window.setTimeout(() => {
    void syncMapleMindUserToExtensionStorage();
  }, 600);
});

window.addEventListener("focus", () => {
  void syncMapleMindUserToExtensionStorage();
});
