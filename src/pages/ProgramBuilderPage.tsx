import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getWorkoutOptions } from "@/store/workoutLibraryStore";
import { getActiveProgram, updateProgram } from "@/utils/programEngine";
import { generateId } from "@/utils/id";
import type { WorkoutDay, WorkoutType } from "@/types/program";

const persianDays = [
  "اول",
  "دوم",
  "سوم",
  "چهارم",
  "پنجم",
  "ششم",
  "هفتم",
  "هشتم",
  "نهم",
  "دهم",
];

function ProgramBuilderPage() {
  const navigate = useNavigate();

  const workouts = getWorkoutOptions();
  const program = getActiveProgram();

  const [days, setDays] = useState<WorkoutDay[]>(() =>
    program.workout.days.map((day) => ({ ...day }))
  );

  function updateDayWorkout(
    index: number,
    workoutId: WorkoutType | null
  ) {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== index) return day;

        const workoutTitle = workoutId
          ? workouts.find((w) => w.id === workoutId)?.title ?? ""
          : "استراحت";

        return {
          ...day,
          workoutId,
          activity: workoutId ? "workout" : "walk",
          title: workoutTitle,
        };
      })
    );
  }

  function addDay() {
    setDays((prev) => [
      ...prev,
      {
        id: generateId(),
        workoutId: null,
        title: "استراحت",
        activity: "walk",
      },
    ]);
  }

  function removeDay(index: number) {
    setDays((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    updateProgram({
      ...program,
      workout: {
        ...program.workout,
        days,
      },
    });

    navigate("/settings");
  }

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      <div className="mb-6 mt-4 text-center">
        <h1 className="text-3xl font-bold">
          تغییر برنامه تمرینی
        </h1>
      </div>

      {days.map((day, index) => (
        <div
          key={day.id}
          className="glass-panel rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold">
              روز {persianDays[index] ?? `${index + 1}`}
            </div>

            <button
              onClick={() => removeDay(index)}
              disabled={days.length <= 1}
              className="text-sm text-red-400 disabled:opacity-30"
            >
              حذف
            </button>
          </div>

          <select
            className="mt-3 w-full rounded-xl border border-forest-500 bg-forest-600 p-3 text-white"
            value={day.workoutId ?? ""}
            onChange={(e) => {
              updateDayWorkout(
                index,
                e.target.value === ""
                  ? null
                  : (e.target.value as WorkoutType)
              );
            }}
          >
            <option value="">استراحت / پیاده‌روی</option>

            {workouts.map((workout) => (
              <option
                key={workout.id}
                value={workout.id}
              >
                {workout.title}
              </option>
            ))}
          </select>
        </div>
      ))}

      <button
        onClick={addDay}
        className="glass-tap w-full rounded-2xl border border-dashed border-forest-500 py-4 text-center font-semibold text-zinc-300"
      >
        + افزودن روز تمرینی
      </button>

      <button
        onClick={handleSave}
        className="w-full rounded-2xl bg-avocado-yellow py-4 text-lg font-bold text-black"
      >
        ذخیره تغییرات
      </button>
    </div>
  );
}

export default ProgramBuilderPage;
