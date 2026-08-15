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
}

/**
 * Merged per date rather than per blob: a day only one side knows about is
 * kept as-is, and a day both sides changed is settled by which side wrote
 * more recently. Days neither device touched today can no longer be lost
 * just because the other device pushed — which is the whole failure this
 * replaces.
 *
 * Without per-entry timestamps the recency test can only be the key's own
 * write time, so it's whole-key recency applied per date. That is strictly
 * better than whole-key replacement and enough for these logs, where two
 * devices rarely edit the same past day.
 */
export function mergeMetricLog(
  localRaw: string | undefined,
  remoteRaw: string | undefined,
  { localTime, remoteTime }: MergeContext,
): string {
  const local = parse<MetricEntry[]>(localRaw, []);
  const remote = parse<MetricEntry[]>(remoteRaw, []);

  const localNewer = localTime !== undefined && (remoteTime === undefined || localTime > remoteTime);

  const byDate = new Map<string, number>();

  for (const entry of localNewer ? remote : local) {
    if (entry?.date) byDate.set(entry.date, entry.value);
  }

  // The newer side written second, so it wins any date both of them carry.
  for (const entry of localNewer ? local : remote) {
    if (entry?.date) byDate.set(entry.date, entry.value);
  }

  return JSON.stringify(
    [...byDate].map(([date, value]) => ({ date, value })).sort((a, b) => (a.date < b.date ? -1 : 1)),
  );
}

/** Union of two id lists — used for the deleted-entry and completion logs. */
export function mergeIdList(
  localRaw: string | undefined,
  remoteRaw: string | undefined,
): string {
  return JSON.stringify([
    ...new Set([...parse<string[]>(localRaw, []), ...parse<string[]>(remoteRaw, [])]),
  ]);
}
