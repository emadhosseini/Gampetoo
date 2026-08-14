import { scopedKey } from "../../utils/userEngine";

/**
 * Five exercises existed twice in the catalogue under different ids — the
 * same movement written out as e.g. both "barbell-bench-press" and
 * "chest-press". The duplicates are gone from workoutLibrary now, but a
 * user who logged sets against the removed id would otherwise lose that
 * history: every set log, personal record and strength-radar contribution
 * is keyed by exercise id alone.
 *
 * So this rewrites the retired ids to their survivors across every store
 * that keys by them, once per account. It runs before the first render (see
 * main.tsx) so nothing reads the old ids in between.
 */
const MERGED_IDS: Record<string, string> = {
  "barbell-bench-press": "chest-press",
  "smith-bench-press": "smith-chest-press",
  row: "barbell-row",
  "shoulder-press": "barbell-shoulder-press",
  "hip-abductor-machine": "abductor-machine",
};

const DONE_KEY = "emad-migration-merged-exercise-ids";

function remap(id: string): string {
  return MERGED_IDS[id] ?? id;
}

// exerciseId -> sessions. Merging two ids means concatenating their session
// lists and folding same-day entries together, so a day logged under both
// names ends up as one session with all its sets rather than two.
function migrateSetLog(raw: string): string {
  const log = JSON.parse(raw) as Record<string, { date: string; sets: unknown[] }[]>;
  const next: Record<string, { date: string; sets: unknown[] }[]> = {};

  for (const [id, sessions] of Object.entries(log)) {
    const target = remap(id);
    const existing = next[target] ?? [];

    for (const session of sessions) {
      const sameDay = existing.find((entry) => entry.date === session.date);

      if (sameDay) {
        sameDay.sets = [...sameDay.sets, ...session.sets];
      } else {
        existing.push({ ...session });
      }
    }

    next[target] = existing;
  }

  return JSON.stringify(next);
}

// Keys are "workoutId:groupId:exerciseId"; only the last segment moves. A
// collision means the surviving id already had its own override in that
// group, which wins — it's the one the user last actually edited there.
function migrateOverrides(raw: string): string {
  const overrides = JSON.parse(raw) as Record<string, unknown>;
  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(overrides)) {
    const parts = key.split(":");
    const id = parts.pop() ?? "";
    const mapped = [...parts, remap(id)].join(":");

    if (!(mapped in next)) next[mapped] = value;
  }

  return JSON.stringify(next);
}

function migrateIdArrayMap(raw: string): string {
  const map = JSON.parse(raw) as Record<string, string[]>;
  const next: Record<string, string[]> = {};

  for (const [key, ids] of Object.entries(map)) {
    next[key] = [...new Set(ids.map(remap))];
  }

  return JSON.stringify(next);
}

function migrateSession(raw: string): string {
  const session = JSON.parse(raw) as { checkedExercises?: string[] };

  if (Array.isArray(session.checkedExercises)) {
    session.checkedExercises = [...new Set(session.checkedExercises.map(remap))];
  }

  return JSON.stringify(session);
}

// Variants store whole exercise objects, not just ids — each one's own id
// field needs rewriting, and a variant that listed both names collapses to
// one entry.
function migrateVariants(raw: string): string {
  const variants = JSON.parse(raw) as {
    groups?: { exercises?: { id: string }[] }[];
  }[];

  for (const variant of variants) {
    for (const group of variant.groups ?? []) {
      const seen = new Set<string>();

      group.exercises = (group.exercises ?? [])
        .map((exercise) => ({ ...exercise, id: remap(exercise.id) }))
        .filter((exercise) => {
          if (seen.has(exercise.id)) return false;

          seen.add(exercise.id);

          return true;
        });
    }
  }

  return JSON.stringify(variants);
}

const MIGRATIONS: { key: string; run: (raw: string) => string }[] = [
  { key: "emad-exercise-set-log", run: migrateSetLog },
  { key: "emad-workout-library-overrides", run: migrateOverrides },
  { key: "emad-workout-exercise-order", run: migrateIdArrayMap },
  { key: "emad-workout-extras", run: migrateIdArrayMap },
  { key: "emad-session", run: migrateSession },
  { key: "emad-workout-variants", run: migrateVariants },
];

export function mergeExerciseIds() {
  const doneKey = scopedKey(DONE_KEY);

  if (localStorage.getItem(doneKey)) return;

  for (const { key, run } of MIGRATIONS) {
    const storageKey = scopedKey(key);
    const raw = localStorage.getItem(storageKey);

    if (!raw) continue;

    try {
      localStorage.setItem(storageKey, run(raw));
    } catch {
      // A single unreadable/renamed blob shouldn't stop the others — the
      // stores are independent, and leaving one behind is far better than
      // aborting the whole migration and retrying it forever.
    }
  }

  localStorage.setItem(doneKey, "1");
}
