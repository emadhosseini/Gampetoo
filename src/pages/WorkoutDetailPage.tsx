import { ChevronDown, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { getWorkout, saveWorkoutExercises } from "@/store/workoutLibraryStore";
import {
  getSpecializedWarmup,
  saveWarmupGroups,
} from "@/store/warmupLibraryStore";

import type { ExerciseGroup } from "@/data/workoutLibrary";
import type { WarmupGroup } from "@/data/warmupLibrary";

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

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      <h1 className="text-2xl font-bold">
        {workout.title}
      </h1>

      <div className="space-y-3">
        {specializedWarmup && (
          <div className="glass-panel rounded-2xl p-4">
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
                      <input
                        type="checkbox"
                        checked={group.enabled}
                        onChange={() => toggleWarmupGroup(group.id)}
                        className="h-5 w-5 shrink-0"
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

        {groups.map((group) => {
          const isOpen = openGroupId === group.id;

          return (
            <div
              key={group.id}
              className="glass-panel rounded-2xl p-4"
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
                    <div
                      key={exercise.id}
                      className="glass-chip glass-static rounded-xl p-4"
                    >
                      <div
                        className={`flex items-center gap-3 ${
                          workout.id === "warmup" ? "" : "mb-4"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={exercise.enabled}
                          onChange={() =>
                            updateExercise(group.id, exercise.id, {
                              enabled: !exercise.enabled,
                            })
                          }
                          className="h-5 w-5 shrink-0"
                        />

                        <span className="flex-1 font-medium">
                          {exercise.name}
                        </span>
                      </div>

                      {workout.id !== "warmup" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-2 text-sm font-medium text-white">
                              ست
                            </div>

                            <div className="selector-pill flex items-center justify-between rounded-xl p-2">
                              <button
                                onClick={() => {
                                  if (exercise.sets <= 1) return;

                                  updateExercise(group.id, exercise.id, {
                                    sets: exercise.sets - 1,
                                  });
                                }}
                              >
                                <Minus size={18} />
                              </button>

                              <span className="font-bold text-white">{exercise.sets}</span>

                              <button
                                onClick={() =>
                                  updateExercise(group.id, exercise.id, {
                                    sets: exercise.sets + 1,
                                  })
                                }
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 text-sm font-medium text-white">
                              تکرار
                            </div>

                            <div className="selector-pill flex items-center justify-between rounded-xl p-2">
                              <button
                                onClick={() => {
                                  if (exercise.reps <= 1) return;

                                  updateExercise(group.id, exercise.id, {
                                    reps: exercise.reps - 1,
                                  });
                                }}
                              >
                                <Minus size={18} />
                              </button>

                              <span className="font-bold text-white">{exercise.reps}</span>

                              <button
                                onClick={() =>
                                  updateExercise(group.id, exercise.id, {
                                    reps: exercise.reps + 1,
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
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        className="glass-tap w-full rounded-2xl bg-avocado-yellow py-4 text-lg font-bold text-black"
      >
        {saved ? "ذخیره شد ✅" : "ذخیره"}
      </button>
    </div>
  );
}
