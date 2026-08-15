import { supabase } from "@/lib/supabaseClient";
import { getCurrentUsername } from "@/utils/userEngine";
import { mergeDailyLog, mergeIdList, mergeMetricLog } from "./mergeStrategies";

// Every localStorage base key that should follow the account across devices.
// Deliberately excludes device-local state: emad-current-username (which
// device is "logged in" right now) and gampetoo-last-seen-version (per-device
// changelog-seen flag).
const SYNCED_BASE_KEYS = [
  "emad-programs",
  "emad-session",
  "emad-workout-completion-log",
  "emad-workout-library-overrides",
  "emad-default-plan-names",
  "emad-workout-extras",
  "emad-workout-exercise-order",
  "emad-workout-variants",
  "emad-exercise-set-log",
  "emad-calendar-preference",
  "emad-app-settings",
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
  "emad-user-weekly-loss",
  "emad-weight-log",
  "emad-weight-target",
  "emad-daily-log",
  "emad-daily-log-deleted",
  "emad-daily-log-history",
  "emad-daily-calorie-target",
  "emad-calorie-mode",
  "emad-learned-foods",
  "emad-water-log",
  "emad-water-goal",
  "emad-activity-log",
  "emad-activity-log-entries",
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

/**
 * When each synced key last changed, as this device understands it — the
 * time it was edited here, or the time it carried when it arrived from the
 * server. Device-local bookkeeping about the account's data, never synced
 * itself.
 */
function keyTimesKey(username: string) {
  return `gampetoo-key-updated-at:${username}`;
}

// Rides along inside the server payload under a name that is not a synced
// base key, which is precisely what makes this change safe to deploy: older
// clients loop over SYNCED_BASE_KEYS and never look at it, so they keep
// reading the same flat key/value pairs they always did. Nesting the values
// instead would have made an un-updated device find no keys at all — and
// writeLocalSnapshot deletes every key it doesn't find, so that device would
// have wiped its own data on the first pull.
const META_KEY = "__meta";
const SNAPSHOT_VERSION = 2;

interface SyncMeta {
  v: number;
  updatedAt: Record<string, string>;
}

function readKeyTimes(username: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(keyTimesKey(username));

    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeKeyTimes(username: string, times: Record<string, string>) {
  originalSetItem(keyTimesKey(username), JSON.stringify(times));
}

/**
 * A fingerprint per key of what this device last successfully sent. The
 * safety net underneath the timestamps: if a key's current value doesn't
 * match what we last got onto the server, this device is holding a change
 * the server has not accepted, and no pull may overwrite it — whatever the
 * timestamps say.
 *
 * Timestamps alone were not enough, because every way of producing them can
 * be wrong. A device whose clock is fast stamps the future. A client too old
 * to know about them strips them and makes its own stale values look freshly
 * written. A write that slips through unstamped has no time at all. Each of
 * those ends the same way: your edit silently replaced by an older value.
 * Comparing against what was actually sent doesn't depend on any of it.
 */
function lastPushedKey(username: string) {
  return `gampetoo-last-pushed:${username}`;
}

// FNV-1a. Not for security — just to avoid keeping a second copy of every
// synced blob on the device purely to compare against.
function fingerprint(value: string): string {
  let hash = 0x811c9dc5;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return `${value.length}:${(hash >>> 0).toString(36)}`;
}

function readLastPushed(username: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(lastPushedKey(username));

    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeLastPushed(username: string, values: Record<string, string>) {
  const prints: Record<string, string> = {};

  for (const base of SYNCED_BASE_KEYS) {
    if (values[base] !== undefined) prints[base] = fingerprint(values[base]);
  }

  originalSetItem(lastPushedKey(username), JSON.stringify(prints));
}

/**
 * The full account snapshot (every key's value + time) as of the last time
 * this device actually confirmed the server holds it — via a successful
 * push, or a pull that found local already matching. This is what plugs a
 * real data-loss bug: pushToServer used to send nothing but
 * readLocalSnapshot(), which only contains keys THIS device has ever
 * written locally. A key it has simply never touched — a feature added
 * after this device last used the app, already pushed from elsewhere —
 * was silently absent from that payload, and Supabase's JSONB upsert
 * REPLACES the whole `data` column rather than deep-merging it. The very
 * next push from this device (for any reason at all — an unrelated
 * setting, a stray pending flag) would erase every key it had no opinion
 * on, permanently, on the server. Filling gaps in the outgoing payload
 * from this cache instead means a push only ever changes the keys this
 * device actually has something to say about.
 */
function lastKnownFullKey(username: string) {
  return `gampetoo-last-known-full:${username}`;
}

interface FullSnapshot {
  values: Record<string, string>;
  times: Record<string, string>;
}

function readLastKnownFull(username: string): FullSnapshot {
  try {
    const raw = localStorage.getItem(lastKnownFullKey(username));

    return raw ? (JSON.parse(raw) as FullSnapshot) : { values: {}, times: {} };
  } catch {
    return { values: {}, times: {} };
  }
}

function writeLastKnownFull(username: string, values: Record<string, string>, times: Record<string, string>) {
  originalSetItem(lastKnownFullKey(username), JSON.stringify({ values, times }));
}

/**
 * Keys whose current local value isn't what this device last got onto the
 * server. Includes a key deleted locally that the server still has.
 */
function unconfirmedKeys(username: string): Set<string> {
  const local = readLocalSnapshot(username);
  const pushed = readLastPushed(username);
  const unconfirmed = new Set<string>();

  for (const base of SYNCED_BASE_KEYS) {
    const value = local[base];
    const print = pushed[base];

    if (value === undefined ? print !== undefined : fingerprint(value) !== print) {
      unconfirmed.add(base);
    }
  }

  return unconfirmed;
}

function recordLocalChange(username: string, base: string) {
  const times = readKeyTimes(username);

  times[base] = new Date().toISOString();

  writeKeyTimes(username, times);
}

/**
 * Splits a stored payload into its values and its per-key times. A row
 * written before this existed has no times at all — every key it holds is
 * stamped with the row's own timestamp, which is exactly what was true of
 * it: the whole thing was written at once.
 */
function readRemote(
  payload: Record<string, unknown>,
  rowUpdatedAt: string
): { values: Record<string, string>; times: Record<string, string> } {
  const meta = payload[META_KEY] as SyncMeta | undefined;
  const values: Record<string, string> = {};

  for (const base of SYNCED_BASE_KEYS) {
    const value = payload[base];

    if (typeof value === "string") {
      values[base] = value;
    }
  }

  if (meta?.updatedAt) {
    return { values, times: meta.updatedAt };
  }

  const times: Record<string, string> = {};

  for (const base of Object.keys(values)) {
    times[base] = rowUpdatedAt;
  }

  return { values, times };
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

/**
 * Merges two versions of the account key by key, newest wins per key. This
 * is the whole point of tracking a time per key rather than one per row:
 * editing your weight on one phone and a meal on another no longer means one
 * of those edits is thrown away, which is what replacing the entire row did.
 *
 * A key with a recorded time but no value is a deletion, and beats an older
 * value — otherwise anything removed on one device would be resurrected by
 * the next push from the other. A key with no recorded time on either side
 * is one neither device has touched since times existed; keep whatever value
 * is there rather than treating absence as intent.
 */
/**
 * Keys whose value is only ever a claim about *today*. emad-session is the
 * one: it carries its own lastDate and is rebuilt from scratch each day.
 *
 * A stale one is not an older edit of the same fact — it is not a statement
 * about today at all, so it must never win, no matter what the timestamps
 * or the unconfirmed-changes bookkeeping say. That bookkeeping is exactly
 * what destroyed real data: a second device that had not been opened for a
 * day still held yesterday's session, had never pushed it, and so counted
 * as holding an "unconfirmed local change" — which wins outright. Opening
 * the app there was enough to overwrite a workout the first device had
 * already completed.
 */
const DAY_SCOPED_KEYS = new Set(["emad-session"]);

function isAboutToday(raw: string | undefined): boolean {
  if (raw === undefined) return false;

  try {
    const { lastDate } = JSON.parse(raw) as { lastDate?: string };
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");

    return (
      lastDate ===
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    );
  } catch {
    return false;
  }
}

/**
 * Keys that are collections, not single values — merged element by element
 * instead of one side replacing the other. Last-writer-wins on a whole log
 * is silent data loss: two devices each logging a meal on the same day
 * meant whichever pushed second erased the other's, which is exactly how a
 * day's calories went backwards.
 *
 * Runs before every other rule below, including the unconfirmed-changes
 * one — those all pick a winner, and the entire point here is that there
 * doesn't have to be one.
 */
function safeIdList(raw: string | undefined): string[] {
  if (raw === undefined) return [];

  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function mergeCollection(
  base: string,
  local: string | undefined,
  remote: string | undefined,
  lt: string | undefined,
  rt: string | undefined,
  deletedIds: Set<string>,
): string | undefined {
  if (local === undefined) return remote;
  if (remote === undefined) return local;

  switch (base) {
    case "emad-daily-log":
      return mergeDailyLog(local, remote, deletedIds);
    // Plain date -> number logs. Water is the one that actually bit (8
    // glasses replaced by 2), but every one of these has the same shape and
    // the same exposure.
    case "emad-water-log":
    case "emad-activity-log":
    case "emad-workout-calorie-log":
    case "emad-daily-log-history":
      return mergeMetricLog(local, remote, { localTime: lt, remoteTime: rt });
    // Append-only id/date lists — a union is always right, and it's what
    // keeps a completion or a deletion recorded on one device from being
    // dropped by the other.
    case "emad-daily-log-deleted":
    case "emad-workout-completion-log":
      return mergeIdList(local, remote);
    default:
      return undefined;
  }
}

function mergeByKey(
  local: Record<string, string>,
  localTimes: Record<string, string>,
  remote: Record<string, string>,
  remoteTimes: Record<string, string>,
  unconfirmed: Set<string>
): { values: Record<string, string>; times: Record<string, string> } {
  const values: Record<string, string> = {};
  const times: Record<string, string> = {};

  // Built from both sides first: a deletion recorded on either device must
  // suppress the entry everywhere, including in the very same merge pass
  // that is unioning the log back together.
  const deletedIds = new Set<string>([
    ...safeIdList(local["emad-daily-log-deleted"]),
    ...safeIdList(remote["emad-daily-log-deleted"]),
  ]);

  for (const base of SYNCED_BASE_KEYS) {
    const lt = localTimes[base];
    const rt = remoteTimes[base];

    let value: string | undefined;
    let time: string | undefined;

    const combined = mergeCollection(base, local[base], remote[base], lt, rt, deletedIds);

    if (combined !== undefined) {
      value = combined;
      // The later of the two, so a device that has merged both sides is not
      // mistaken for one holding stale data on the next comparison.
      time = lt !== undefined && rt !== undefined ? (lt > rt ? lt : rt) : (lt ?? rt);
    } else if (DAY_SCOPED_KEYS.has(base) && isAboutToday(remote[base]) !== isAboutToday(local[base])) {
      // Exactly one side is about today — it wins, and the other is simply
      // yesterday's leftovers. Checked before everything below, because
      // both the unconfirmed rule and the timestamps would happily let
      // those leftovers through.
      const preferRemote = isAboutToday(remote[base]);

      value = preferRemote ? remote[base] : local[base];
      time = preferRemote ? rt : lt;
    } else if (unconfirmed.has(base)) {
      // Holding a change the server hasn't taken. Nothing coming back from
      // it can be newer than something it has never seen, so this wins
      // outright — no timestamp is consulted, because every source of
      // timestamps has a way of being wrong and this doesn't.
      value = local[base];
      // Stamped now if it somehow never was, so it also wins on the way out.
      time = lt ?? new Date().toISOString();
    } else if (lt !== undefined && (rt === undefined || lt > rt)) {
      // ISO-8601 UTC strings, so lexicographic order is chronological order.
      value = local[base];
      time = lt;
    } else if (rt !== undefined) {
      value = remote[base];
      time = rt;
    } else {
      value = local[base] ?? remote[base];
    }

    if (value !== undefined) values[base] = value;
    if (time !== undefined) times[base] = time;
  }

  return { values, times };
}

async function writeRemote(
  username: string,
  values: Record<string, string>,
  times: Record<string, string>
): Promise<void> {
  if (!supabase || !cachedAuthUserId) return;

  const updatedAt = new Date().toISOString();

  try {
    const { error } = await supabase.from("user_data").upsert({
      user_id: cachedAuthUserId,
      data: { ...values, [META_KEY]: { v: SNAPSHOT_VERSION, updatedAt: times } },
      updated_at: updatedAt,
    });

    if (error) throw error;

    originalSetItem(lastSyncedKey(username), updatedAt);
    originalRemoveItem(pendingKey(username));
    // Only after the server confirmed it. Anything that differs from this
    // from now on is a change it hasn't seen — see unconfirmedKeys.
    writeLastPushed(username, values);
    // This is now, by definition, the full account state the server holds
    // — see readLastKnownFull's own comment for why the next push needs it.
    writeLastKnownFull(username, values, times);
  } catch {
    // Offline or transient failure — flag it so the next reconnect retries.
    originalSetItem(pendingKey(username), "1");
  }
}

/**
 * Sends this device's values along with the times it believes they carry,
 * without reading the server first — the cheap path, for the moment the app
 * is being closed and there may not be time for two round trips.
 *
 * Safe despite overwriting the row wholesale, because the times go with it.
 * If this clobbers a key another device changed more recently, that device
 * still holds its own newer time for it, sees the row is behind on its next
 * reconcile, and puts it back. The overwrite corrects itself.
 *
 * Crucially, this does NOT send bare readLocalSnapshot()/readKeyTimes() —
 * those only cover keys this device has ever written locally. A key added
 * by a newer app version (or just never touched on this particular device)
 * would be silently missing from that payload, and since the upsert
 * replaces the whole `data` column rather than deep-merging it, sending it
 * bare would erase that key from the server outright — the account's other
 * devices simply lose it. Layering local's own values/times over the last
 * full snapshot this device actually knows the server holds (see
 * readLastKnownFull) means a push only ever changes the keys this device
 * has something real to say about — an explicit local edit or deletion
 * (recorded in localTimes) — and leaves every other key exactly as this
 * device last saw it.
 */
async function pushToServer(username: string): Promise<void> {
  const local = readLocalSnapshot(username);
  const localTimes = readKeyTimes(username);
  const known = readLastKnownFull(username);

  // No cached picture of the server's full state yet — this device's very
  // first push this session (or since a factory reset), before it's ever
  // completed a pull. The cache-fill below has nothing to fill gaps FROM
  // in that case, which is exactly the situation that used to wipe every
  // key this device had never touched: an account that's synced for weeks
  // updates to a build with a brand-new feature, and the very first local
  // edit after opening the app — for any reason, not necessarily related
  // to the new feature — pushes before the boot pull finishes, erasing it
  // from the server. Reading the server for real this one time (instead of
  // the fast cached-merge path below) is the only way to know what's
  // actually there before deciding what a bare upsert would destroy.
  // Every push after this one has a cache to work from and skips this.
  if (Object.keys(known.values).length === 0 && supabase && cachedAuthUserId) {
    const { data } = await supabase
      .from("user_data")
      .select("data, updated_at")
      .eq("user_id", cachedAuthUserId)
      .maybeSingle();

    if (data) {
      const remote = readRemote(data.data as Record<string, unknown>, data.updated_at);
      const merged = mergeByKey(local, localTimes, remote.values, remote.times, unconfirmedKeys(username));

      // Not just an upload: this device just learned about every key it
      // never had (including possibly this one's own history from before
      // it existed on this device at all). Writing it into local storage
      // too — not just the server — matters beyond simply catching this
      // device up: without it, the next unconfirmedKeys() check sees a
      // fingerprint for a key readLocalSnapshot() still can't find (from
      // writeRemote's own writeLastPushed below) and reads that as "this
      // device deleted it locally, defend the deletion" — silently
      // discarding the very data this push just went out of its way to
      // save, on the very next pull.
      suppressing = true;

      try {
        writeLocalSnapshot(username, merged.values);
      } finally {
        suppressing = false;
      }

      writeKeyTimes(username, merged.times);

      await writeRemote(username, merged.values, merged.times);
      return;
    }
  }

  const values: Record<string, string> = { ...known.values };
  const times: Record<string, string> = { ...known.times };

  for (const base of SYNCED_BASE_KEYS) {
    // Never touched on this device (no recorded change/deletion time for
    // it) — leave whatever the cached snapshot already has, untouched.
    if (localTimes[base] === undefined) continue;

    if (local[base] !== undefined) {
      values[base] = local[base];
    } else {
      // Recorded a time but has no value: an explicit local deletion.
      delete values[base];
    }

    times[base] = localTimes[base];
  }

  await writeRemote(username, values, times);
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

  const local = readLocalSnapshot(username);
  const localTimes = readKeyTimes(username);
  const remote = readRemote(
    data.data as Record<string, unknown>,
    data.updated_at
  );

  const merged = mergeByKey(
    local,
    localTimes,
    remote.values,
    remote.times,
    unconfirmedKeys(username)
  );

  const localChanged = snapshotsDiffer(local, merged.values);

  if (localChanged) {
    suppressing = true;

    try {
      writeLocalSnapshot(username, merged.values);
    } finally {
      suppressing = false;
    }
  }

  writeKeyTimes(username, merged.times);

  // Push back whenever the server isn't already holding the merged result —
  // including when it holds the same values but no times yet, since that row
  // is the old format and nothing else will upgrade it.
  if (
    snapshotsDiffer(remote.values, merged.values) ||
    (data.data as Record<string, unknown>)[META_KEY] === undefined
  ) {
    // writeRemote records the confirmed baseline itself, and only if the
    // server actually took it.
    await writeRemote(username, merged.values, merged.times);
  } else {
    originalSetItem(lastSyncedKey(username), data.updated_at);
    // The server already holds exactly this, so it is confirmed. Without
    // recording it, everything that arrived by pull would look like an
    // unsent local change forever — which, among other things, made a
    // deletion from another device come straight back, since this device
    // would keep "defending" the value it had just been given.
    writeLastPushed(username, merged.values);
    // Same reason as writeRemote's own call — this is the full state the
    // server holds right now, and the next push needs it to avoid wiping
    // any key this device hasn't itself touched.
    writeLastKnownFull(username, merged.values, merged.times);
  }

  return localChanged;
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

/**
 * Deliberately does NOT require an auth session. Recording that something
 * changed is bookkeeping about local data; it has nothing to do with whether
 * a server is reachable, and the push it schedules already copes with not
 * being able to run yet.
 *
 * Requiring one here silently dropped every edit made in the first few
 * hundred milliseconds after the app opened — the window where
 * supabase.auth.getSession() has not resolved and cachedAuthUserId is still
 * null. An edit in that window was neither stamped nor queued, so nothing
 * downstream knew it had happened, and the boot pull moments later
 * overwrote it with the server's older value. Logging a glass of water on a
 * cold start and watching it revert is exactly that window.
 */
function onLocalWrite(key: string) {
  if (suppressing || !supabase) return;

  const username = getCurrentUsername();
  if (!username) return;

  const isSyncedKey = SYNCED_BASE_KEYS.some(
    (base) => key === `${base}:${username}`
  );

  if (isSyncedKey) {
    // Stamped before the push is even scheduled: this is what lets the merge
    // tell "I changed this" from "I happen to hold this", and it has to
    // survive the app being killed before the push goes out.
    recordLocalChange(username, key.slice(0, key.length - username.length - 1));
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
/**
 * Runs `write` without the sync engine treating what it writes as a user
 * edit — no timestamp bump, no dirty key, nothing queued to push.
 *
 * For writes a device makes *to itself* rather than on the user's behalf:
 * the daily session reset at midnight, the lazily-persisted cycle anchor.
 * Those are re-derived independently by every device, so letting them count
 * as edits made the last device to merely OPEN the app authoritative — and
 * because an unconfirmed local change wins the merge outright (see
 * mergeByKey), a second device opening the app after a rollover pushed its
 * freshly-blanked session over the top of a workout the primary device had
 * already completed, destroying it. A derived write must never out-rank a
 * real one; the way to guarantee that is to not announce it at all.
 */
export function withoutSyncTracking<T>(write: () => T): T {
  const previous = suppressing;

  suppressing = true;

  try {
    return write();
  } finally {
    suppressing = previous;
  }
}

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
  // Left behind, these would make a freshly created account reusing this
  // username look like it had already edited every key, so the merge would
  // prefer its empty values over whatever the server holds.
  originalRemoveItem(keyTimesKey(username));
  originalRemoveItem(lastPushedKey(username));
  // Same reasoning — a stale cached "full account state" from before the
  // reset would let the very next push resurrect keys the reset just wiped.
  originalRemoveItem(lastKnownFullKey(username));
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
