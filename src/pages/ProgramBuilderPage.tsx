import { useState } from "react";
import { useNavigate } from "react-router-dom";

import WorkoutPickerModal from "@/components/WorkoutPickerModal";
import StartDateModal from "@/components/StartDateModal";
import { getWorkout } from "@/store/workoutLibraryStore";
import { getActiveProgram, updateProgram } from "@/utils/programEngine";
import { resetSession } from "@/utils/sessionEngine";
import { generateId } from "@/utils/id";
import type { WorkoutDay, WorkoutType } from "@/types/program";
import { toFaDigits } from "@/utils/numberFormat";
import { formatJalaliFull } from "@/utils/dateFormat";

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

  const program = getActiveProgram();
  // No startDate yet means this is the very first time a program is being
  // built (the home page's "select a program" card led here) rather than
  // an existing program being edited later.
  const isFirstTime = !program.startDate;

  const [days, setDays] = useState<WorkoutDay[]>(() =>
    program.workout.days.map((day) => ({ ...day }))
  );
  // Which day's WorkoutPickerModal is open — index into `days`, or null
  // when closed.
  const [pickerDayIndex, setPickerDayIndex] = useState<number | null>(null);
  // Empty until explicitly chosen via StartDateModal — handleSave falls
  // back to program.startDate (an existing cycle's own date, untouched) or
  // today (brand new cycle, never asked) when this is still empty.
  const [startDate, setStartDate] = useState("");
  const [startDateModalOpen, setStartDateModalOpen] = useState(false);

  function updateDayWorkout(
    index: number,
    workoutId: WorkoutType | null
  ) {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== index) return day;

        const workoutTitle = workoutId
          ? (getWorkout(workoutId)?.title ?? "")
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
      // Explicitly picked via the "روز شروع برنامه" button takes priority;
      // otherwise an existing cycle's own startDate is left untouched (so
      // editing days later doesn't shift it), falling back to today only
      // for a brand new cycle that was never asked.
      startDate: startDate || program.startDate || today(),
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
          className="glass-panel glass-static rounded-2xl p-4"
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

          <button
            onClick={() => setPickerDayIndex(index)}
            className="selector-pill mt-3 w-full rounded-xl p-3 text-right font-bold text-white"
          >
            {day.workoutId ? day.title : "استراحت / پیاده‌روی"}
          </button>
        </div>
      ))}

      <button
        onClick={addDay}
        className="ghost-action w-full rounded-2xl py-4 text-center font-medium text-white"
      >
        + افزودن روز تمرینی
      </button>

      <button
        onClick={() => setStartDateModalOpen(true)}
        className="selector-pill w-full rounded-2xl py-4 text-center font-bold text-white"
      >
        {startDate
          ? `شروع از ${formatJalaliFull(startDate)}`
          : "روز شروع برنامه"}
      </button>

      <button
        onClick={handleSave}
        disabled={days.length === 0}
        className="w-full rounded-2xl glass-action py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isFirstTime ? "شروع برنامه" : "ذخیره تغییرات"}
      </button>

      <WorkoutPickerModal
        open={pickerDayIndex !== null}
        onClose={() => setPickerDayIndex(null)}
        onPick={(workoutId) => {
          if (pickerDayIndex !== null) {
            updateDayWorkout(pickerDayIndex, workoutId as WorkoutType | null);
          }
        }}
      />

      <StartDateModal
        open={startDateModalOpen}
        onClose={() => setStartDateModalOpen(false)}
        onPick={setStartDate}
      />
    </div>
  );
}

export default ProgramBuilderPage;
