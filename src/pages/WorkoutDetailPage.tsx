import { Minus, Plus } from "lucide-react";
import { useReducer } from "react";
import { useParams } from "react-router-dom";

import {
  getWorkout,
  toggleExercise,
  updateReps,
  updateSets,
} from "@/store/workoutLibraryStore";

export default function WorkoutDetailPage() {
  const { id } = useParams();

  const [, refresh] = useReducer((x) => x + 1, 0);

  const workout = id ? getWorkout(id) : undefined;

  if (!workout) {
    return (
      <div className="py-10 text-center">
        تمرین پیدا نشد.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {workout.title}
      </h1>

      {workout.groups.map((group) => (
        <div
          key={group.id}
          className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="mb-4 text-lg font-semibold">
            {group.title}
          </h2>

          <div className="space-y-4">
            {group.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="rounded-xl border border-zinc-100 p-4 dark:border-zinc-800"
              >
                <button
                  onClick={() => {
                    toggleExercise(
                      workout.id,
                      group.id,
                      exercise.id,
                    );

                    refresh();
                  }}
                  className="mb-4 flex w-full items-center justify-between"
                >
                  <span className="font-medium">
                    {exercise.name}
                  </span>

                  <span className="text-2xl">
                    {exercise.enabled ? "✅" : "⬜"}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2 text-sm text-zinc-500">
                      ست
                    </div>

                    <div className="flex items-center justify-between rounded-xl border p-2">
                      <button
                        onClick={() => {
                          if (exercise.sets <= 1) return;

                          updateSets(
                            workout.id,
                            group.id,
                            exercise.id,
                            exercise.sets - 1,
                          );

                          refresh();
                        }}
                      >
                        <Minus size={18} />
                      </button>

                      <span>{exercise.sets}</span>

                      <button
                        onClick={() => {
                          updateSets(
                            workout.id,
                            group.id,
                            exercise.id,
                            exercise.sets + 1,
                          );

                          refresh();
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-zinc-500">
                      تکرار
                    </div>

                    <div className="flex items-center justify-between rounded-xl border p-2">
                      <button
                        onClick={() => {
                          if (exercise.reps <= 1) return;

                          updateReps(
                            workout.id,
                            group.id,
                            exercise.id,
                            exercise.reps - 1,
                          );

                          refresh();
                        }}
                      >
                        <Minus size={18} />
                      </button>

                      <span>{exercise.reps}</span>

                      <button
                        onClick={() => {
                          updateReps(
                            workout.id,
                            group.id,
                            exercise.id,
                            exercise.reps + 1,
                          );

                          refresh();
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}