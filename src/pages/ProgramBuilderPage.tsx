import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getWorkoutOptions } from "@/store/workoutLibraryStore";
import { getActiveProgram, updateProgram } from "@/utils/programEngine";
import { resetSession } from "@/utils/sessionEngine";
import { generateId } from "@/utils/id";
import type { WorkoutDay, WorkoutType } from "@/types/program";
import { toFaDigits } from "@/utils/numberFormat";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

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
  // No startDate yet means this is the very first time a program is being
  // built (the home page's "select a program" card led here) rather than
  // an existing program being edited later.
  const isFirstTime = !program.startDate;

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
      // First save ever starts the cycle today — an existing startDate is
      // left untouched so editing days later doesn't shift it.
      startDate: program.startDate || today(),
      workout: {
        ...program.workout,
        days,
      },
    });

    // Only on the very first save — resetting session state (today's
    // completed flag) on a later edit would wipe a workout the user
    // already did today just because they tweaked a day's exercise.
    if (isFirstTime) {
      resetSession();
    }

    navigate("/");
  }

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      <div className="mb-6 mt-4 text-center">
        <h1 className="text-3xl font-bold">
          {isFirstTime ? "برنامه تمرینی روزانه رو بساز" : "تغییر برنامه تمرینی"}
        </h1>
      </div>

      {days.map((day, index) => (
        <div
          key={day.id}
          className="day-card-gradient rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-white">
              روز {persianDays[index] ?? toFaDigits(index + 1)}
            </div>

            <button
              onClick={() => removeDay(index)}
              disabled={days.length <= 1}
              className="text-sm text-white disabled:opacity-30"
            >
              حذف
            </button>
          </div>

          <select
            className="selector-pill mt-3 w-full rounded-xl p-3 font-bold text-white"
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
        className="ghost-action w-full rounded-2xl py-4 text-center font-medium text-white"
      >
        + افزودن روز تمرینی
      </button>

      <button
        onClick={handleSave}
        disabled={days.length === 0}
        className="w-full rounded-2xl glass-action py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isFirstTime ? "شروع برنامه" : "ذخیره تغییرات"}
      </button>
    </div>
  );
}

export default ProgramBuilderPage;
