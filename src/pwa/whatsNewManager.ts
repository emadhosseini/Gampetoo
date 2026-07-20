import { hasCurrentUsername, scopedKey } from "@/utils/userEngine";

const LAST_SEEN_VERSION_KEY = "gampetoo-last-seen-version";

export interface WhatsNewState {
  open: boolean;
}

let state: WhatsNewState = { open: false };

const listeners = new Set<(state: WhatsNewState) => void>();

let initialized = false;

function setState(patch: Partial<WhatsNewState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener(state));
}

/**
 * Decides whether to show the changelog for the version that's running right
 * now, by comparing it against the last version this account has seen. Shows
 * nothing on a brand-new account (nothing to compare against) and nothing when
 * the current release has no highlights to show.
 */
function init() {
  if (initialized) return;

  initialized = true;

  // Login/setup always does a full page reload on completion (this app has no
  // in-place auth reactivity), so this re-runs with fresh module state once a
  // username exists — no need to re-check on route changes.
  if (!hasCurrentUsername()) return;

  const key = scopedKey(LAST_SEEN_VERSION_KEY);

  let lastSeen: string | null;

  try {
    lastSeen = localStorage.getItem(key);
  } catch {
    return;
  }

  const isGenuineUpgrade =
    lastSeen !== null &&
    lastSeen !== __APP_VERSION__ &&
    __APP_CHANGELOG__.length > 0;

  if (isGenuineUpgrade) {
    setState({ open: true });
  }

  try {
    localStorage.setItem(key, __APP_VERSION__);
  } catch {
    // Ignore storage failures — worst case the same changelog shows again later.
  }
}

function dismiss() {
  setState({ open: false });
}

function getState(): WhatsNewState {
  return state;
}

function subscribe(listener: (state: WhatsNewState) => void): () => void {
  listeners.add(listener);
  listener(state);

  return () => listeners.delete(listener);
}

export const whatsNewManager = {
  init,
  getState,
  subscribe,
  dismiss,
  version: __APP_VERSION__,
  highlights: __APP_CHANGELOG__,
};
