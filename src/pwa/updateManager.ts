import { registerSW } from "virtual:pwa-register";

// Re-checks while the app stays open for a long time in the background — the
// main trigger is still every reopen/foreground below.
const BACKGROUND_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export type UpdateStatus = "idle" | "available" | "updating";

export interface UpdateState {
  status: UpdateStatus;
  currentVersion: string;
  newVersion: string | null;
}

type Listener = (state: UpdateState) => void;

let state: UpdateState = {
  status: "idle",
  currentVersion: __APP_VERSION__,
  newVersion: null,
};

const listeners = new Set<Listener>();

function setState(patch: Partial<UpdateState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener(state));
}

async function fetchDeployedVersion(): Promise<string | null> {
  try {
    // version.json isn't in the SW precache glob, and cache: "no-store" bypasses
    // the HTTP cache too, so this always reflects what's actually deployed.
    const res = await fetch(`/version.json?_=${Date.now()}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();

    return typeof data?.current === "string" ? data.current : null;
  } catch {
    return null;
  }
}

let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;
let initialized = false;

// The most recently dismissed version, so routine re-checks (visibilitychange,
// focus, the hourly interval) don't immediately re-show the prompt for the same
// still-pending update the user already said "بعداً" to. A genuinely new app
// session (full reload) resets this along with the rest of the module state,
// so the prompt does return on the next real reopen.
let dismissedVersion: string | null = null;

/**
 * Registers the service worker and starts watching for updates. Safe to call
 * more than once (e.g. React StrictMode double-invoke) — only registers once.
 */
function init() {
  if (initialized) return;

  initialized = true;

  updateSW = registerSW({
    immediate: true,

    onNeedRefresh() {
      fetchDeployedVersion().then((newVersion) => {
        if (newVersion !== null && newVersion === dismissedVersion) {
          return;
        }

        setState({ status: "available", newVersion });
      });
    },

    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {
            // Offline or transient failure — ignore, try again next check.
          });
        }
      };

      checkForUpdate();

      document.addEventListener("visibilitychange", checkForUpdate);
      window.addEventListener("focus", checkForUpdate);
      setInterval(checkForUpdate, BACKGROUND_CHECK_INTERVAL_MS);
    },
  });
}

/** Hide the prompt. The waiting worker is left untouched — no refresh happens,
 * the app keeps running on the current version, and the new version stays
 * installed and waiting until the user chooses to update. */
function dismissUpdate() {
  dismissedVersion = state.newVersion;
  setState({ status: "idle" });
}

/** Activate the waiting worker and reload into the new version. */
async function applyUpdate() {
  if (!updateSW) return;

  setState({ status: "updating" });

  try {
    await updateSW(true);
  } finally {
    // Safety net: some environments don't reliably fire `controllerchange`
    // right after skipWaiting, which is what triggers the library's own
    // reload. Force one shortly after so the prompt never lingers.
    setTimeout(() => window.location.reload(), 1500);
  }
}

function getState(): UpdateState {
  return state;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);

  return () => listeners.delete(listener);
}

export const updateManager = {
  init,
  getState,
  subscribe,
  dismissUpdate,
  applyUpdate,
};
