/**
 * Per-key merge rules for the synced blobs that are really collections.
 *
 * Everything in remoteSync is otherwise last-writer-wins on the whole
 * value, which is fine for a single setting but silently destructive for a
 * log: two devices each add a meal on the same day, one pushes, and the
 * other's meal is simply gone — the whole day's blob was replaced. That is
 * exactly how a 1338-calorie day came back as 1239.
 *
 * These functions take both sides and combine them, so a value only ever
 * disappears because it was actually deleted, never because the other
 * device happened to write last. Pure and total: any parse failure falls
 * back to one whole side rather than throwing mid-merge.
 */

export interface MergeContext {
  /** ISO timestamp this side's value was last written, if known. */
  localTime?: string;
  remoteTime?: string;
}

function parse<T>(raw: string | undefined, fallback: T): T {
  if (raw === undefined) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------
// emad-daily-log — date -> mealId -> entries[], each entry with its own id
// ---------------------------------------------------------------------

interface Entry {
  id: string;
  [key: string]: unknown;
}

type DayLog = { meals: Record<string, Entry[]> };
type LogsByDate = Record<string, DayLog>;

/**
 * Union by entry id, minus anything recorded as deleted.
 *
 * Deletions need their own record because a union can't tell "device B
 * never had this" from "device B deleted it" — without one, deleting a
 * meal on the phone would have it handed straight back by the laptop.
 * See deletedEntryIds in dailyLogEngine, which is synced alongside.
 */
export function mergeDailyLog(
  localRaw: string | undefined,
  remoteRaw: string | undefined,
  deletedIds: Set<string>,
): string {
  const local = parse<LogsByDate>(localRaw, {});
  const remote = parse<LogsByDate>(remoteRaw, {});
  const merged: LogsByDate = {};

  for (const date of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const meals: Record<string, Entry[]> = {};
    const localMeals = local[date]?.meals ?? {};
    const remoteMeals = remote[date]?.meals ?? {};

    for (const mealId of new Set([...Object.keys(localMeals), ...Object.keys(remoteMeals)])) {
      const byId = new Map<string, Entry>();

      // Remote first, then local — an entry edited on this device (its
      // amount rescaled, say) keeps the local version, since that's the
      // one the person is looking at right now.
      for (const entry of remoteMeals[mealId] ?? []) {
        if (entry?.id && !deletedIds.has(entry.id)) byId.set(entry.id, entry);
      }

      for (const entry of localMeals[mealId] ?? []) {
        if (entry?.id && !deletedIds.has(entry.id)) byId.set(entry.id, entry);
      }

      if (byId.size > 0) meals[mealId] = [...byId.values()];
    }

    merged[date] = { meals };
  }

  return JSON.stringify(merged);
}

// ---------------------------------------------------------------------
// Date-keyed metric logs — [{ date, value }]
// ---------------------------------------------------------------------

interface MetricEntry {
  date: string;
  value: number;
  /** When this date's value was written — see DailyMetricEntry.at. */
  at?: string;
}

/**
 * Merged per date. A day only one side knows about is kept as-is; a day
 * both sides carry goes to the entry that was written later, by its own
 * `at` — never by the key's write time, which is not a fact about any
 * single date and, worse, decides nothing at all whenever the two sides
 * agree on it. They agree constantly: every merge stamps both sides with
 * the later of the two times and pushes that, so all devices sit on an
 * identical key time until the next edit.
 *
 * When `at` can't settle it — an entry written by a build from before it
 * existed, on either side — LOCAL wins. That is the deliberate part. The
 * old rule handed those ties to the remote copy, which is precisely how a
 * glass of water logged on this phone came back as the count from before
 * it: reopening the app pulls, the tie goes to the server, and the pull
 * even reloads the page to show it. Between two values that cannot be
 * ordered, the one the person is looking at is the better guess, and any
 * genuinely newer value from another device carries an `at` to prove it.
 *
 * `localTime`/`remoteTime` are therefore unused here, kept only so the
 * signature stays uniform with the other mergers.
 */
export function mergeMetricLog(
  localRaw: string | undefined,
  remoteRaw: string | undefined,
  _context: MergeContext,
): string {
  const local = parse<MetricEntry[]>(localRaw, []);
  const remote = parse<MetricEntry[]>(remoteRaw, []);

  const byDate = new Map<string, MetricEntry>();

  for (const entry of remote) {
    if (entry?.date) byDate.set(entry.date, entry);
  }

  // Local written second, so it takes every date it shares with the remote
  // side unless that side's entry is provably newer.
  for (const entry of local) {
    if (!entry?.date) continue;

    const existing = byDate.get(entry.date);

    // Only a comparison between two real timestamps can take a date away
    // from this device. One side missing its own is not evidence the other
    // is newer — an entry logged here before the app updated has no `at`,
    // and that must not be read as "the server knows better".
    const remoteIsNewer =
      existing?.at !== undefined && entry.at !== undefined && entry.at < existing.at;

    if (remoteIsNewer) continue;

    byDate.set(entry.date, entry);
  }

  return JSON.stringify(
    [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1)),
  );
}

/**
 * Union of completion entries by date. Where both sides know a date, the
 * richer one wins: a device still on the old date-only shape must not
 * erase the workout/plan another device recorded for that same day.
 */
export function mergeCompletionLog(
  localRaw: string | undefined,
  remoteRaw: string | undefined,
): string {
  const norm = (raw: string | undefined) =>
    parse<unknown[]>(raw, []).map((item) =>
      typeof item === "string" ? { date: item } : (item as { date?: string }),
    );

  const byDate = new Map<string, Record<string, unknown>>();

  for (const entry of [...norm(remoteRaw), ...norm(localRaw)]) {
    if (typeof entry?.date !== "string") continue;

    const existing = byDate.get(entry.date);
    const merged = { ...existing, ...entry };

    // Never let a bare {date} overwrite details already recorded.
    byDate.set(entry.date, Object.keys(merged).length >= Object.keys(existing ?? {}).length ? merged : existing!);
  }

  return JSON.stringify([...byDate.values()]);
}

/** Union of two id lists — used for the deleted-entry log. */
export function mergeIdList(
  localRaw: string | undefined,
  remoteRaw: string | undefined,
): string {
  return JSON.stringify([
    ...new Set([...parse<string[]>(localRaw, []), ...parse<string[]>(remoteRaw, [])]),
  ]);
}
