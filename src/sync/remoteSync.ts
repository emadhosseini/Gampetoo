import { supabase } from "@/lib/supabaseClient";
import { getCurrentUsername } from "@/utils/userEngine";

// Every localStorage base key that should follow the account across devices.
// Deliberately excludes device-local state: emad-current-username (which
// device is "logged in" right now) and gampetoo-last-seen-version (per-device
// changelog-seen flag).
const SYNCED_BASE_KEYS = [
  "emad-programs",
  "emad-session",
  "emad-workout-library-overrides",
  "emad-warmup-library-overrides",
  "emad-free-meal",
  "emad-free-meal-settings",
  "emad-user-name",
  "emad-weight-log",
];

const PUSH_DEBOUNCE_MS = 1000;
const RETRY_INTERVAL_MS = 5 * 60 * 1000;

const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

let patched = false;
let initialized = false;
let suppressing = false;
let cachedAuthUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function pendingKey(username: string) {
  return `gampetoo-sync-pending:${username}`;
}

function lastSyncedKey(username: string) {
  return `gampetoo-last-synced-at:${username}`;
}

function readLocalSnapshot(username: string): Record<string, string> {
  const snapshot: Record<string, string> = {};

  for (const base of SYNCED_BASE_KEYS) {
    const value = localStorage.getItem(`${base}:${username}`);

    if (value !== null) {
      snapshot[base] = value;
    }
  }

  return snapshot;
}

function writeLocalSnapshot(
  username: string,
  snapshot: Record<string, string>
) {
  for (const base of SYNCED_BASE_KEYS) {
    const key = `${base}:${username}`;
    const value = snapshot[base];

    if (typeof value === "string") {
      originalSetItem(key, value);
    } else {
      originalRemoveItem(key);
    }
  }
}

async function pushToServer(username: string): Promise<void> {
  if (!supabase || !cachedAuthUserId) return;

  const snapshot = readLocalSnapshot(username);
  const updatedAt = new Date().toISOString();

  try {
    const { error } = await supabase.from("user_data").upsert({
      user_id: cachedAuthUserId,
      data: snapshot,
      updated_at: updatedAt,
    });

    if (error) throw error;

    originalSetItem(lastSyncedKey(username), updatedAt);
    originalRemoveItem(pendingKey(username));
  } catch {
    // Offline or transient failure — flag it so the next reconnect retries.
    originalSetItem(pendingKey(username), "1");
  }
}

/**
 * Pulls the account's remote data down over local, unless local is already at
 * least as new (guards against clobbering edits made while offline). If no
 * remote row exists yet, this is the account's first-ever sync — bootstrap
 * the server from whatever's already stored locally instead.
 */
async function pullFromServer(username: string): Promise<void> {
  if (!supabase || !cachedAuthUserId) return;

  const { data, error } = await supabase
    .from("user_data")
    .select("data, updated_at")
    .eq("user_id", cachedAuthUserId)
    .maybeSingle();

  if (error) return;

  if (!data) {
    await pushToServer(username);
    return;
  }

  const lastSyncedAt = localStorage.getItem(lastSyncedKey(username));

  if (lastSyncedAt && new Date(lastSyncedAt) >= new Date(data.updated_at)) {
    return;
  }

  suppressing = true;

  try {
    writeLocalSnapshot(username, data.data as Record<string, string>);
  } finally {
    suppressing = false;
  }

  originalSetItem(lastSyncedKey(username), data.updated_at);
}

function schedulePush(username: string) {
  if (pushTimer) clearTimeout(pushTimer);

  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushToServer(username);
  }, PUSH_DEBOUNCE_MS);
}

function onLocalWrite(key: string) {
  if (suppressing || !supabase || !cachedAuthUserId) return;

  const username = getCurrentUsername();
  if (!username) return;

  const isSyncedKey = SYNCED_BASE_KEYS.some(
    (base) => key === `${base}:${username}`
  );

  if (isSyncedKey) {
    schedulePush(username);
  }
}

function patchLocalStorage() {
  if (patched) return;
  patched = true;

  localStorage.setItem = (key: string, value: string) => {
    originalSetItem(key, value);
    onLocalWrite(key);
  };

  localStorage.removeItem = (key: string) => {
    originalRemoveItem(key);
    onLocalWrite(key);
  };
}

function retryPendingIfAny() {
  const username = getCurrentUsername();
  if (!username) return;

  if (localStorage.getItem(pendingKey(username)) === "1") {
    void pushToServer(username);
  }
}

/** Called once at app boot. Safe to call even when sync isn't configured. */
export function initSync() {
  if (initialized) return;
  initialized = true;

  if (!supabase) return;

  patchLocalStorage();

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAuthUserId = session?.user.id ?? null;
  });

  window.addEventListener("online", retryPendingIfAny);
  setInterval(retryPendingIfAny, RETRY_INTERVAL_MS);

  supabase.auth.getSession().then(({ data }) => {
    cachedAuthUserId = data.session?.user.id ?? null;

    const username = getCurrentUsername();

    if (cachedAuthUserId && username) {
      void pullFromServer(username);
    }
  });
}

/**
 * Call right after a successful sign-in/sign-up, before deciding whether the
 * account already has a program set up — a returning user's data won't exist
 * locally yet on a new device until this pull completes.
 */
export async function syncAfterLogin(username: string): Promise<void> {
  if (!supabase) return;

  const { data } = await supabase.auth.getSession();

  cachedAuthUserId = data.session?.user.id ?? null;

  if (cachedAuthUserId) {
    await pullFromServer(username);
  }
}

export function resetSyncMarkers(username: string) {
  originalRemoveItem(pendingKey(username));
  originalRemoveItem(lastSyncedKey(username));
}

/**
 * Cancels any pending debounced push and pushes immediately instead. Call
 * this — awaited — before any `window.location.replace/reload` that follows
 * a mutation, since a full reload tears down the JS context (and any pending
 * setTimeout) before the normal 1s debounce would otherwise fire.
 */
export async function flushPendingSync(username: string): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }

  await pushToServer(username);
}
