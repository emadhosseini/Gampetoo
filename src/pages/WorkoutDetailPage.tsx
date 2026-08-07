import { ChevronDown, Minus, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import Toggle from "@/components/Toggle";
import { getWorkout, saveWorkoutExercises } from "@/store/workoutLibraryStore";
import {
  getSpecializedWarmup,
  saveWarmupGroups,
} from "@/store/warmupLibraryStore";

import type { Exercise, ExerciseGroup } from "@/data/workoutLibrary";
import type { WarmupGroup } from "@/data/warmupLibrary";
import { matchesWordPrefix, normalizeFa } from "@/utils/persianSearch";
import { toFaDigits } from "@/utils/numberFormat";

// The toggle-plus-steppers block a single exercise is edited with — shared
// between the normal per-group list and the search results below, so a
// found exercise is edited with literally the same control it would be
// edited with inside its own group, not a second copy that could drift
// from it.
function ExerciseEditRow({
  exercise,
  isWarmupWorkout,
  onUpdate,
}: {
  exercise: Exercise;
  isWarmupWorkout: boolean;
  onUpdate: (patch: Partial<Exercise>) => void;
}) {
  return (
    <div className="glass-chip glass-static rounded-xl p-4">
      <div
        className={`flex items-center gap-3 ${isWarmupWorkout ? "" : "mb-4"}`}
      >
        <Toggle
          checked={exercise.enabled}
          onChange={() => onUpdate({ enabled: !exercise.enabled })}
        />

        <span className="flex-1 font-medium">{exercise.name}</span>
      </div>

      {!isWarmupWorkout && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-2 text-sm font-medium text-white">ست</div>

            <div className="selector-pill flex items-center justify-between rounded-xl p-2">
              <button
                onClick={() => {
                  if (exercise.sets <= 1) return;

                  onUpdate({ sets: exercise.sets - 1 });
                }}
              >
                <Minus size={18} />
              </button>

              <span className="font-bold text-white">{toFaDigits(exercise.sets)}</span>

              <button onClick={() => onUpdate({ sets: exercise.sets + 1 })}>
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-white">
              {exercise.unit === "seconds" ? "ثانیه" : "تکرار"}
            </div>

            <div className="selector-pill flex items-center justify-between rounded-xl p-2">
              <button
                onClick={() => {
                  const step = exercise.unit === "seconds" ? 5 : 1;

                  if (exercise.reps <= step) return;

                  onUpdate({ reps: exercise.reps - step });
                }}
              >
                <Minus size={18} />
              </button>

              <span className="font-bold text-white">{toFaDigits(exercise.reps)}</span>

              <button
                onClick={() =>
                  onUpdate({
                    reps: exercise.reps + (exercise.unit === "seconds" ? 5 : 1),
                  })
                }
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkoutDetailPage() {
  const { id } = useParams();

  const workout = id ? getWorkout(id) : undefined;
  const specializedWarmup = id ? getSpecializedWarmup(id) : undefined;

  const [groups, setGroups] = useState<ExerciseGroup[]>(
    () => workout?.groups ?? [],
  );

  const [warmupGroups, setWarmupGroups] = useState<WarmupGroup[]>(
    () => specializedWarmup?.groups ?? [],
  );

  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const [warmupSectionOpen, setWarmupSectionOpen] = useState(false);

  const [saved, setSaved] = useState(false);

  const [query, setQuery] = useState("");

  // Flattened across every group rather than searched per-group, since the
  // whole point is finding a move without knowing (or opening) which group
  // it's filed under first — that's the actual friction this replaces, on
  // a page like Push where "سینه"/"شانه"/"پشت بازو" each hide their own
  // exercises behind a collapsed header.
  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeFa(query);

    if (!normalizedQuery) return [];

    return groups.flatMap((group) =>
      group.exercises
        .filter((exercise) =>
          matchesWordPrefix(normalizeFa(exercise.name), normalizedQuery),
        )
        .map((exercise) => ({ group, exercise })),
    );
  }, [groups, query]);

  if (!workout) {
    return (
      <div className="py-10 text-center">
        تمرین پیدا نشد.
      </div>
    );
  }

  function toggleWarmupGroup(groupId: string) {
    setSaved(false);

    setWarmupGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : { ...group, enabled: !group.enabled },
      ),
    );
  }

  function updateExercise(
    groupId: string,
    exerciseId: string,
    patch: Partial<ExerciseGroup["exercises"][number]>,
  ) {
    setSaved(false);

    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              exercises: group.exercises.map((exercise) =>
                exercise.id !== exerciseId
                  ? exercise
                  : { ...exercise, ...patch },
              ),
            },
      ),
    );
  }

  function handleSave() {
    saveWorkoutExercises(workout!.id, groups);

    if (specializedWarmup) {
      saveWarmupGroups(specializedWarmup.workoutType, warmupGroups);
    }

    setSaved(true);
  }

  const isWarmupWorkout = workout.id === "warmup";

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      <h1 className="text-2xl font-bold">
        {workout.title}
      </h1>

      <div className="space-y-3">
        {/* Above everything else on the page, including گرم کردن تخصصی —
            finding a move shouldn't depend on knowing which collapsed
            section it's filed under, or scrolling past the warmup block to
            get there. Editing a result uses the exact same control as the
            group list below (ExerciseEditRow), so there's nothing extra to
            learn once something's found. */}
        {groups.length > 0 && (
          <div className="glass-panel glass-static rounded-2xl p-4">
            <div className="glass-chip flex items-center gap-2 rounded-xl p-2">
              <Search size={16} className="shrink-0 text-white/60" />

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی حرکت..."
                className="w-full bg-transparent px-1 py-2 text-sm text-white placeholder:text-white/50 outline-none"
              />
            </div>

            {query.trim() && (
              <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="py-2 text-center text-sm text-white/60">
                    حرکتی پیدا نشد.
                  </p>
                ) : (
                  searchResults.map(({ group, exercise }) => (
                    <div key={exercise.id}>
                      <p className="mb-1 px-1 text-xs text-white/50">
                        {group.title}
                      </p>

                      <ExerciseEditRow
                        exercise={exercise}
                        isWarmupWorkout={isWarmupWorkout}
                        onUpdate={(patch) =>
                          updateExercise(group.id, exercise.id, patch)
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {specializedWarmup && (
          <div className="glass-panel glass-static rounded-2xl p-4">
            <button
              onClick={() => setWarmupSectionOpen((prev) => !prev)}
              className="flex w-full items-center justify-between"
            >
              <h2 className="text-lg font-semibold">
                گرم کردن تخصصی
              </h2>

              <ChevronDown
                className={`h-5 w-5 text-zinc-200 transition-transform ${
                  warmupSectionOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {warmupSectionOpen && (
              <div className="mt-4 space-y-3">
                {warmupGroups.map((group) => (
                  <div
                    key={group.id}
                    className="glass-chip glass-static rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={group.enabled}
                        onChange={() => toggleWarmupGroup(group.id)}
                      />

                      <span className="flex-1 font-medium">
                        {group.title}
                      </span>
                    </div>

                    {group.enabled && (
                      <ul className="mt-3 space-y-2">
                        {group.exercises.map((exercise) => (
                          <li
                            key={exercise.id}
                            className="glass-chip rounded-lg px-3 py-2 text-sm"
                          >
                            {exercise.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {groups.length === 0 && (
          <div className="glass-panel rounded-2xl p-6 text-center">
            <p className="text-white">
              حرکتی برای این تمرین هنوز اضافه نشده — به‌زودی اضافه می‌شه.
            </p>
          </div>
        )}

        {groups.map((group) => {
          const isOpen = openGroupId === group.id;

          return (
            <div
              key={group.id}
              className="glass-panel glass-static rounded-2xl p-4"
            >
              <button
                onClick={() =>
                  setOpenGroupId(isOpen ? null : group.id)
                }
                className="flex w-full items-center justify-between"
              >
                <h2 className="text-lg font-semibold">
                  {group.title}
                </h2>

                <ChevronDown
                  className={`h-5 w-5 text-zinc-200 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-4 space-y-4">
                  {group.exercises.map((exercise) => (
                    <ExerciseEditRow
                      key={exercise.id}
                      exercise={exercise}
                      isWarmupWorkout={isWarmupWorkout}
                      onUpdate={(patch) =>
                        updateExercise(group.id, exercise.id, patch)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(groups.length > 0 || specializedWarmup) && (
        <button
          onClick={handleSave}
          className="w-full glass-action rounded-2xl py-4 text-lg font-bold text-white"
        >
          {saved ? "ذخیره شد ✅" : "ذخیره"}
        </button>
      )}
    </div>
  );
}
