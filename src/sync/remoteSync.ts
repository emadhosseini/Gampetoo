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
  "emad-user-gender",
  "emad-user-height",
  "emad-user-age",
  "emad-user-birth-date",
  "emad-user-activity-level",
  "emad-user-calorie-goal",
  "emad-weight-log",
  "emad-weight-target",
  "emad-daily-log",
  "emad-daily-log-history",
  "emad-daily-calorie-target",
  "emad-calorie-mode",
  "emad-learned-foods",
  "emad-water-log",
  "emad-water-goal",
  "emad-activity-log",
  "emad-workout-calorie-log",
];

const PUSH_DEBOUNCE_MS = 1000;
const RETRY_INTERVAL_MS = 5 * 60 * 1000;
// Returning to the app is a cheap, frequent signal — on a phone, switching
// away and back fires it constantly. This is the floor between two pulls it
// can actually trigger.
const FOREGROUND_PULL_MIN_INTERVAL_MS = 10 * 1000;

const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

let patched = false;
let initialized = false;
let suppressing = false;
let cachedAuthUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastForegroundPullAt = 0;

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

function snapshotsDiffer(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  return SYNCED_BASE_KEYS.some((base) => a[base] !== b[base]);
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
 * Pulls the account's remote data down over local. If no remote row exists
 * yet, this is the account's first-ever sync — bootstrap the server from
 * whatever's already stored locally instead.
 *
 * Whether local is safe to overwrite is decided by whether this device has
 * anything unpushed, NOT by comparing timestamps. `updated_at` is written by
 * whichever device pushed, from its own clock, so a phone running even a few
 * minutes fast would stamp the row into the future and then refuse every
 * later pull — `lastSyncedAt >= updated_at` would hold forever, and that
 * device would silently stop receiving the other's changes for good. With
 * nothing pending, local is by definition what this device last pushed, so
 * any difference in content means some other device has written since, which
 * is exactly the question worth asking.
 *
 * Returns whether anything on this device actually changed, so a caller that
 * pulls into an already-rendered app knows whether the screen it's looking at
 * has gone stale.
 */
async function pullFromServer(username: string): Promise<boolean> {
  if (!supabase || !cachedAuthUserId) return false;

  // Local edits that haven't reached the server outrank anything here —
  // send them first, or the pull below would overwrite writes that were
  // never even offered. If that push fails we're offline; leave local alone.
  if (hasUnpushedChanges(username)) {
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }

    await pushToServer(username);

    if (hasUnpushedChanges(username)) return false;
  }

  const { data, error } = await supabase
    .from("user_data")
    .select("data, updated_at")
    .eq("user_id", cachedAuthUserId)
    .maybeSingle();

  if (error) return false;

  if (!data) {
    await pushToServer(username);
    return false;
  }

  const incoming = data.data as Record<string, string>;
  const changed = snapshotsDiffer(readLocalSnapshot(username), incoming);

  suppressing = true;

  try {
    writeLocalSnapshot(username, incoming);
  } finally {
    suppressing = false;
  }

  originalSetItem(lastSyncedKey(username), data.updated_at);

  return changed;
}

/**
 * Pulls when the app comes back to the foreground, so an edit made on another
 * device shows up without closing and reopening the app. Previously the only
 * pulls were at boot and just after login, which meant a second device kept
 * showing whatever it had loaded with.
 *
 * Unpushed local edits are sent before anything is taken — pullFromServer
 * owns that rule, since every entry point into it needs the same thing.
 *
 * The guard that belongs here:
 *
 * - A pull that actually changed something reloads the page. Nothing in this
 *   app subscribes to localStorage (every screen reads it during render), so
 *   an already-mounted screen would otherwise go on showing the values it
 *   read at mount while storage underneath it says something else. Reloading
 *   on return to the app is the least disruptive moment there is for it.
 */
function pullOnForeground() {
  if (document.visibilityState !== "visible") return;
  if (!supabase || !cachedAuthUserId) return;

  const username = getCurrentUsername();
  if (!username) return;

  const now = Date.now();

  if (now - lastForegroundPullAt < FOREGROUND_PULL_MIN_INTERVAL_MS) return;

  lastForegroundPullAt = now;

  void pullFromServer(username).then((changed) => {
    if (changed) window.location.reload();
  });
}

function hasUnpushedChanges(username: string): boolean {
  return pushTimer !== null || localStorage.getItem(pendingKey(username)) === "1";
}

function schedulePush(username: string) {
  // Marked before the push is even attempted, not just when one fails. A
  // phone frozen or killed during the debounce below never runs the timer
  // and never reaches pushToServer's catch, so a flag set only on failure
  // would leave the edit looking synced when it had never been sent. Set
  // here, the next launch finds it and retries.
  originalSetItem(pendingKey(username), "1");

  if (pushTimer) clearTimeout(pushTimer);

  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushToServer(username);
  }, PUSH_DEBOUNCE_MS);
}

/**
 * Pushes immediately when the app goes away, instead of leaving an edit
 * sitting in the debounce above. Backgrounding an installed PWA freezes its
 * JS context — a pending setTimeout simply never fires — so an edit made in
 * a popup that closes without navigating (height, gender, birth date, a
 * weigh-in, a logged meal) could stay on the device indefinitely. The paths
 * that already called flushPendingSync before navigating were the only ones
 * reliably reaching the server.
 *
 * pagehide and visibilitychange both, because neither alone covers every
 * way a phone puts an app away, and a redundant push is harmless.
 */
function flushOnHide() {
  if (!supabase || !cachedAuthUserId) return;

  const username = getCurrentUsername();
  if (!username) return;
  if (!hasUnpushedChanges(username)) return;

  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }

  void pushToServer(username);
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

  // Whatever last session left unsent — a phone frozen mid-debounce, a push
  // that failed offline — goes out now, before the pull below can consider
  // overwriting it.
  retryPendingIfAny();

  // visibilitychange rather than window focus: it's the one that fires when
  // an installed PWA is switched back to on a phone, which is where a second
  // device showing stale data actually bites.
  document.addEventListener("visibilitychange", pullOnForeground);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOnHide();
  });
  window.addEventListener("pagehide", flushOnHide);

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

/**
 * Removes every synced key for `username` from this device.
 *
 * The engines' own reset*() calls are the real wipe — each owns its keys and
 * knows what "empty" means for them. This is the backstop underneath, so
 * that "a reset leaves nothing synced behind" holds by construction instead
 * of by everyone remembering to wire their new key into resetApplication().
 * The list it walks is the same one that defines what syncing even means, so
 * the two can't drift apart. A key that was already reset is simply removed
 * twice.
 *
 * Uses the unpatched removeItem: the caller pushes (or deletes the account)
 * straight after, and there's no point queueing one debounced push per key.
 */
export function clearSyncedKeys(username: string) {
  for (const base of SYNCED_BASE_KEYS) {
    originalRemoveItem(`${base}:${username}`);
  }
}

export function resetSyncMarkers(username: string) {
  // A push queued by the writes that led here would otherwise fire a second
  // later, against an account that may no longer exist.
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }

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
