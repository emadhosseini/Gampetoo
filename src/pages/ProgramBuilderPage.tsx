import { useState } from "react";
import { useNavigate } from "react-router-dom";

import WorkoutPickerModal from "@/components/WorkoutPickerModal";
import StartDateModal from "@/components/StartDateModal";
import ModalOverlay from "@/components/ModalOverlay";
import VariantAssignModal from "@/components/VariantAssignModal";
import { getWorkout } from "@/store/workoutLibraryStore";
import { getVariants } from "@/store/workoutVariantStore";
import { getActiveProgram, updateProgram } from "@/utils/programEngine";
import { resetSession } from "@/utils/sessionEngine";
import { generateId } from "@/utils/id";
import type { WorkoutDay, WorkoutType } from "@/types/program";
import { toFaDigits } from "@/utils/numberFormat";
import { formatDisplayFull, getTodayLocalDate } from "@/utils/dateFormat";

const today = getTodayLocalDate;

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
  // Which day's VariantAssignModal is open — same index convention.
  const [variantDayIndex, setVariantDayIndex] = useState<number | null>(null);
  // Empty until explicitly chosen via StartDateModal — handleSave falls
  // back to program.startDate (an existing cycle's own date, untouched) or
  // today (brand new cycle, never asked) when this is still empty.
  const [startDate, setStartDate] = useState("");
  const [startDateModalOpen, setStartDateModalOpen] = useState(false);
  // Whether an explicit start-date change (on an already-running program,
  // not the first-ever save) is waiting on confirmation before it actually
  // applies — restarting the cycle from a new date changes what shows on
  // the home/workout pages right away, so it isn't applied silently.
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);

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
          // A previous day's assigned plans belonged to whatever workout
          // used to be here — carrying them over to a newly-picked, likely
          // unrelated workout would silently assign plans that don't exist
          // for it.
          assignedVariantIds: undefined,
        };
      })
    );
  }

  function updateDayVariants(index: number, variantIds: string[]) {
    setDays((prev) =>
      prev.map((day, i) =>
        i !== index ? day : { ...day, assignedVariantIds: variantIds },
      ),
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

  // A start date explicitly picked on an already-running program (not the
  // very first save) restarts the cycle — day 1 becomes that date on the
  // home/workout pages — so it's confirmed before applying rather than
  // silently taking effect the moment "ذخیره تغییرات" is tapped.
  const restartsCycle =
    !isFirstTime && startDate !== "" && startDate !== program.startDate;

  function applySave() {
    updateProgram({
      ...program,
      // Explicitly picked via the "روز شروع برنامه" button takes priority;
      // otherwise an existing cycle's own startDate is left untouched (so
      // editing days later doesn't shift it), falling back to today only
      // for a brand new cycle that was never asked.
      startDate: startDate || program.startDate || today(),
      // An explicitly-picked start date means "day 1 is this date, full
      // stop" — a stale shift from an earlier "فراموش کردم" tap on the old
      // cycle would otherwise keep nudging the day index and the new start
      // date would stop landing on day 1 like it's supposed to.
      cycleShiftDays: startDate ? 0 : program.cycleShiftDays,
      // Same reason as cycleShiftDays above: cycleAnchor is the cycle's
      // actual resolved position now (see programEngine's
      // resolveCycleAnchor) and takes priority over startDate if left in
      // place, which would silently undo this reset.
      cycleAnchor: startDate ? undefined : program.cycleAnchor,
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

  function handleSave() {
    if (restartsCycle) {
      setRestartConfirmOpen(true);
      return;
    }

    applySave();
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
            {day.workoutId ? day.title : "استراحت"}
          </button>

          {/* Only worth showing once this workout actually has a saved
              plan beyond پیش‌فرض to rotate with — an empty state here would
              just be a dead end pointing at WorkoutDetailPage's own "+"
              instead of doing anything useful from this page. */}
          {day.workoutId && getVariants(day.workoutId).length > 0 && (
            <button
              onClick={() => setVariantDayIndex(index)}
              className="glass-tap glass-static mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-white/70"
            >
              چند حالت برنامه
              {(day.assignedVariantIds?.length ?? 0) > 1 &&
                ` (${toFaDigits(day.assignedVariantIds!.length)} حالت)`}
            </button>
          )}
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
          ? `شروع از ${formatDisplayFull(startDate)}`
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

      <VariantAssignModal
        open={variantDayIndex !== null}
        workoutId={variantDayIndex !== null ? days[variantDayIndex]?.workoutId ?? null : null}
        initialSelected={variantDayIndex !== null ? days[variantDayIndex]?.assignedVariantIds : undefined}
        onClose={() => setVariantDayIndex(null)}
        onSave={(variantIds) => {
          if (variantDayIndex !== null) {
            updateDayVariants(variantDayIndex, variantIds);
          }
        }}
      />

      <StartDateModal
        open={startDateModalOpen}
        onClose={() => setStartDateModalOpen(false)}
        onPick={setStartDate}
      />

      {restartConfirmOpen && (
        <ModalOverlay onClose={() => setRestartConfirmOpen(false)}>
          <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
            <h2 className="text-lg font-bold text-white">تغییر روز شروع برنامه</h2>

            <p className="text-sm text-white/70">
              با این کار روز اول برنامه دقیقاً {formatDisplayFull(startDate)} می‌شه و
              برنامه‌ی صفحه‌ی خانه و تمرین از همون روز عوض می‌شه. مطمئنی؟
            </p>

            <button
              onClick={() => {
                setRestartConfirmOpen(false);
                applySave();
              }}
              className="w-full glass-action rounded-2xl py-3 font-bold text-white"
            >
              تایید و ذخیره
            </button>

            <button
              onClick={() => setRestartConfirmOpen(false)}
              className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
            >
              انصراف
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

export default ProgramBuilderPage;
