import type {
  Exercise,
  WorkoutDefinition,
} from "../../data/workoutLibrary";

/**
 * Pure query/selection logic over the exercise database — no storage, no
 * React, no side effects (same contract as calorieCalculator and
 * strengthCalculator beside it). Callers hand in a library and get a
 * derived view back.
 *
 * This exists because "تمام بدن" used to carry its own hand-maintained copy
 * of movements that push/pull/legs already defined: the same exercise
 * written out twice, free to drift apart in name, sets or description. A
 * whole-body day isn't really a separate catalogue — it's a *view* over the
 * one catalogue, which is what the functions here express.
 */

export type MuscleCategoryId =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "abs"
  | "cardio";

export interface MuscleCategory {
  id: MuscleCategoryId;
  label: string;
  // MuscleWiki primaryMuscle values (see Exercise.primaryMuscle) that roll
  // up into this category. Matching on the declared muscle rather than
  // parsing the Persian name is deliberate — see strengthStatsEngine, where
  // name-keyword guessing silently dropped exercises whenever one was
  // reworded.
  muscles: string[];
}

export const MUSCLE_CATEGORIES: MuscleCategory[] = [
  { id: "chest", label: "سینه", muscles: ["Chest", "Upper Chest", "Lower Chest"] },
  { id: "back", label: "پشت", muscles: ["Lats", "Middle Back", "Lower Back", "Traps"] },
  {
    id: "shoulders",
    label: "سرشانه",
    muscles: ["Shoulders", "Front Deltoids", "Side Deltoids", "Rear Deltoids"],
  },
  { id: "arms", label: "بازو", muscles: ["Biceps", "Triceps", "Forearms"] },
  {
    id: "legs",
    label: "پا",
    muscles: ["Quads", "Hamstrings", "Glutes", "Calves", "Adductors", "Abductors"],
  },
  { id: "abs", label: "شکم", muscles: ["Abdominals", "Obliques"] },
  { id: "cardio", label: "هوازی", muscles: ["Cardio"] },
];

const CATEGORY_BY_MUSCLE = new Map<string, MuscleCategoryId>(
  MUSCLE_CATEGORIES.flatMap((category) =>
    category.muscles.map((muscle) => [muscle, category.id] as const),
  ),
);

export function categoryOf(exercise: Exercise): MuscleCategoryId | null {
  return exercise.primaryMuscle
    ? (CATEGORY_BY_MUSCLE.get(exercise.primaryMuscle) ?? null)
    : null;
}

/**
 * Every exercise in the library, once each. The same movement is
 * deliberately listed under several days (a bench press belongs to both
 * push and upper) — this collapses those to one entry, first occurrence
 * winning, so a catalogue-wide view never shows the same exercise twice.
 */
export function flattenExercises(library: WorkoutDefinition[]): Exercise[] {
  const byId = new Map<string, Exercise>();

  for (const workout of library) {
    for (const group of workout.groups) {
      for (const exercise of group.exercises) {
        if (!byId.has(exercise.id)) byId.set(exercise.id, exercise);
      }
    }
  }

  return [...byId.values()];
}

export interface ExerciseFilter {
  category?: MuscleCategoryId | null;
  equipment?: string | null;
  searchQuery?: string;
}

// Persian text needs normalising before comparison: Arabic ي/ك reach the
// app from some keyboards where Persian ی/ک are meant, and the zero-width
// non-joiner inside words like "سیم‌کش" is invisible to a user typing
// "سیم کش". Lower-cased too, so the English half of a name matches
// regardless of how it's typed.
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/‌/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesSearch(exercise: Exercise, query: string): boolean {
  const q = normalize(query);

  if (!q) return true;

  return (
    normalize(exercise.name).includes(q) ||
    normalize(exercise.nameEn ?? "").includes(q)
  );
}

export function filterExercises(
  exercises: Exercise[],
  { category, equipment, searchQuery = "" }: ExerciseFilter,
): Exercise[] {
  return exercises.filter((exercise) => {
    if (category && categoryOf(exercise) !== category) return false;
    if (equipment && exercise.equipment !== equipment) return false;

    return matchesSearch(exercise, searchQuery);
  });
}

/** Every distinct equipment value in the given set, for building filter chips. */
export function availableEquipment(exercises: Exercise[]): string[] {
  return [
    ...new Set(
      exercises
        .map((exercise) => exercise.equipment)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
}

// Which categories a whole-body day should touch, and how many movements
// to take from each. Legs gets two because it's the largest muscle mass
// and one movement can't cover both quad- and hip-dominant patterns; the
// rest get one so a session stays a realistic length. Arms and cardio are
// left out on purpose — arms already get worked by the compound presses and
// pulls chosen here, and cardio isn't strength work.
const FULL_BODY_PLAN: { category: MuscleCategoryId; count: number }[] = [
  { category: "chest", count: 1 },
  { category: "back", count: 1 },
  { category: "legs", count: 2 },
  { category: "shoulders", count: 1 },
  { category: "abs", count: 1 },
];

/**
 * A ready-made whole-body session: one or two standard movements per major
 * muscle group, picked from the catalogue rather than hand-listed.
 *
 * Compound movements are preferred over isolation ones — a whole-body day
 * has room for maybe six exercises, so each should train as much as
 * possible, and a bench press earns its slot over a cable fly. Within that,
 * the catalogue's own order decides, which puts the foundational barbell
 * lifts first because that's how each day's groups are already written.
 */
export function getFullBodyPreset(exercises: Exercise[]): Exercise[] {
  const preset: Exercise[] = [];

  for (const { category, count } of FULL_BODY_PLAN) {
    const candidates = exercises.filter((exercise) => categoryOf(exercise) === category);

    const ranked = [
      ...candidates.filter((exercise) => exercise.mechanic === "Compound"),
      ...candidates.filter((exercise) => exercise.mechanic !== "Compound"),
    ];

    // When a category contributes more than one movement, they should train
    // different muscles within it — the two leg slots picking a squat and a
    // leg press both means quads twice and nothing for the hamstrings or
    // glutes, which defeats the point of the second slot. Falls back to the
    // ranking above if the category can't supply enough distinct muscles.
    const chosen: Exercise[] = [];
    const usedMuscles = new Set<string>();

    for (const exercise of ranked) {
      if (chosen.length === count) break;

      const muscle = exercise.primaryMuscle ?? "";

      if (usedMuscles.has(muscle)) continue;

      usedMuscles.add(muscle);
      chosen.push(exercise);
    }

    for (const exercise of ranked) {
      if (chosen.length === count) break;
      if (!chosen.includes(exercise)) chosen.push(exercise);
    }

    preset.push(...chosen);
  }

  return preset;
}
