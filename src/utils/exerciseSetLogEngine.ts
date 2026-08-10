import { generateId } from "./id";
import { getTodayLocalDate } from "./dateFormat";
import { scopedKey } from "./userEngine";

const STORAGE_KEY = "emad-exercise-set-log";

export interface SetEntry {
  id: string;
  weight: number;
  reps: number;
  // Ticking a set's confirm button is what actually counts it — toward
  // the personal record, the history list, and the progress chart. An
  // unconfirmed row (still being typed, or never finished) doesn't count
  // as a real set yet.
  confirmed: boolean;
}

interface SessionEntry {
  date: string;
  sets: SetEntry[];
}

// exerciseId -> that exercise's own logged sessions, one per calendar day
// it was actually logged on.
type Log = Record<string, SessionEntry[]>;

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

function readLog(): Log {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return {};

  try {
    return JSON.parse(saved) as Log;
  } catch {
    return {};
  }
}

function writeLog(log: Log) {
  localStorage.setItem(storageKey(), JSON.stringify(log));
}

function sessionsFor(log: Log, exerciseId: string): SessionEntry[] {
  return log[exerciseId] ?? [];
}

export function getTodaysSets(exerciseId: string): SetEntry[] {
  const today = getTodayLocalDate();

  return sessionsFor(readLog(), exerciseId).find((s) => s.date === today)?.sets ?? [];
}

function upsertToday(exerciseId: string, sets: SetEntry[]) {
  const log = readLog();
  const sessions = sessionsFor(log, exerciseId);
  const today = getTodayLocalDate();
  const index = sessions.findIndex((s) => s.date === today);

  if (index >= 0) {
    sessions[index] = { date: today, sets };
  } else {
    sessions.push({ date: today, sets });
  }

  log[exerciseId] = sessions;

  writeLog(log);
}

// New set defaults to the last one's own weight/reps — either today's
// previous set, or (for the day's very first set) the last confirmed set
// from the most recent earlier session — rather than zero. A set is
// almost always "the same again", so this is one fewer thing to type for
// the common case of just repeating the last real number entered.
export function addSet(exerciseId: string): SetEntry[] {
  const current = getTodaysSets(exerciseId);
  const lastToday = current[current.length - 1];

  const lastFromHistory = lastToday
    ? undefined
    : getPastSessions(exerciseId, 1)[0]?.sets.filter((set) => set.confirmed).slice(-1)[0];

  const seed = lastToday ?? lastFromHistory;

  const next: SetEntry = {
    id: generateId(),
    weight: seed?.weight ?? 0,
    reps: seed?.reps ?? 0,
    confirmed: false,
  };

  const updated = [...current, next];

  upsertToday(exerciseId, updated);

  return updated;
}

export function updateSet(
  exerciseId: string,
  setId: string,
  patch: Partial<Pick<SetEntry, "weight" | "reps">>,
): SetEntry[] {
  const updated = getTodaysSets(exerciseId).map((set) =>
    set.id === setId ? { ...set, ...patch } : set,
  );

  upsertToday(exerciseId, updated);

  return updated;
}

export function confirmSet(exerciseId: string, setId: string): SetEntry[] {
  const updated = getTodaysSets(exerciseId).map((set) =>
    set.id === setId ? { ...set, confirmed: true } : set,
  );

  upsertToday(exerciseId, updated);

  return updated;
}

export function removeSet(exerciseId: string, setId: string): SetEntry[] {
  const updated = getTodaysSets(exerciseId).filter((set) => set.id !== setId);

  upsertToday(exerciseId, updated);

  return updated;
}

export interface PastSession {
  date: string;
  sets: SetEntry[];
}

// Most recent first, today excluded (that's the live table above it) —
// and only sessions with at least one confirmed set, since an empty or
// all-unconfirmed session never really happened.
export function getPastSessions(exerciseId: string, limit = 10): PastSession[] {
  const today = getTodayLocalDate();

  return sessionsFor(readLog(), exerciseId)
    .filter((session) => session.date !== today && session.sets.some((set) => set.confirmed))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

export interface PersonalRecord {
  weight: number;
  reps: number;
  date: string;
}

// Heaviest confirmed set ever logged for this exercise, across every
// session including today's live one — its reps come along too, since a
// weight alone isn't enough to estimate a 1RM from it (see
// strengthCalculator.ts's caller in strengthStatsEngine.ts).
export function getPersonalRecord(exerciseId: string): PersonalRecord | null {
  const sessions = sessionsFor(readLog(), exerciseId);
  let best: PersonalRecord | null = null;

  for (const session of sessions) {
    for (const set of session.sets) {
      if (!set.confirmed) continue;

      if (!best || set.weight > best.weight) {
        best = { weight: set.weight, reps: set.reps, date: session.date };
      }
    }
  }

  return best;
}

export interface ExerciseHistoryPoint {
  date: string;
  heaviestWeight: number;
  // Estimated one-rep max via the Epley formula, from that day's single
  // heaviest confirmed set — the standard estimate for "how strong you
  // are" from ordinary multi-rep sets, without asking anyone to actually
  // attempt a true 1RM.
  estimated1RM: number;
  volume: number;
}

// One point per day this exercise was actually logged (confirmed sets
// only), oldest first — what the progress chart and its stats are built
// from.
export function getExerciseHistory(exerciseId: string): ExerciseHistoryPoint[] {
  const sessions = sessionsFor(readLog(), exerciseId);

  return sessions
    .map((session): ExerciseHistoryPoint | null => {
      const confirmed = session.sets.filter((set) => set.confirmed);

      if (confirmed.length === 0) return null;

      const heaviestSet = confirmed.reduce((a, b) => (b.weight > a.weight ? b : a));
      const heaviestWeight = heaviestSet.weight;
      const estimated1RM = Math.round(heaviestSet.weight * (1 + heaviestSet.reps / 30));
      const volume = confirmed.reduce((sum, set) => sum + set.weight * set.reps, 0);

      return { date: session.date, heaviestWeight, estimated1RM, volume };
    })
    .filter((point): point is ExerciseHistoryPoint => point !== null)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function resetExerciseSetLog() {
  localStorage.removeItem(storageKey());
}
