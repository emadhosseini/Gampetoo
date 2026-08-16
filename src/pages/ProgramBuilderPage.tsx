import { useState } from "react";
import { useNavigate } from "react-router-dom";

import WorkoutPickerModal from "@/components/WorkoutPickerModal";
import StartDateModal from "@/components/StartDateModal";
import ModalOverlay from "@/components/ModalOverlay";
import VariantAssignModal from "@/components/VariantAssignModal";
import { getDefaultPlanName, getWorkout } from "@/store/workoutLibraryStore";
import { DEFAULT_VARIANT_ID, getVariant, getVariants } from "@/store/workoutVariantStore";
import { getCompletionFor, isCompletedOn } from "@/utils/workoutCompletionLog";
import { getSession } from "@/utils/sessionEngine";
import {
  formatDisplayFull,
  formatDisplayShort,
  formatWeekdayName,
  getTodayLocalDate,
  isoToLocalDate,
} from "@/utils/dateFormat";
import { cycleDayDates, getActiveProgram, updateProgram } from "@/utils/programEngine";
import { resetSession } from "@/utils/sessionEngine";
import { generateId } from "@/utils/id";
import type { WorkoutDay, WorkoutType } from "@/types/program";
import { toFaDigits } from "@/utils/numberFormat";

const today = getTodayLocalDate;


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

  // Real dates for each cycle position, so the list reads as a calendar
  // rather than an abstract "روز اول/دوم/سوم" the user has to translate in
  // their head — translating it wrong is exactly how a plan meant for a
  // future day landed on one already finished.
  const dayDates = cycleDayDates(days.length);
  const todayIso = getTodayLocalDate();

  // Rendered starting from today and running forward, not from the cycle's
  // own "day 1". Nobody sets up or edits a program in the past: the days
  // that matter are today (if it isn't already done) and the ones after
  // it, so showing the cycle from an arbitrary position that may sit days
  // behind just adds a step of "which of these is today?".
  //
  // Display order only — `days` itself still defines the cycle, and every
  // handler below gets the real index into it, so reordering what's on
  // screen can't reorder the program.
  // Today's own pick, if the workout page asked and got an answer.
  const todaysPick = getSession().selectedVariantId;
  const todayIndex = dayDates.indexOf(todayIso);
  const displayOrder =
    todayIndex < 0
      ? days.map((_, index) => index)
      : days.map((_, offset) => (todayIndex + offset) % days.length);

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      <div className="mb-6 mt-4 text-center">
        <h1 className="text-3xl font-bold">
          {isFirstTime ? "برنامه تمرینی روزانه رو بساز" : "تقویم تمرینی"}
        </h1>
      </div>

      {/* Two to a row and square-ish rather than one full-width block
          each: a cycle is a handful of days, and seeing them side by side
          reads as a calendar you can take in at a glance instead of a
          scrolling form. */}
      <div className="grid grid-cols-2 gap-3">
        {displayOrder.map((index) => {
          const day = days[index];
          const iso = dayDates[index];
          const isToday = iso === todayIso;
          // A finished day is history. Editing it here used to rewrite what
          // had already been done, so it's shown but not editable.
          const locked = isToday && isCompletedOn(iso);
          // The plan actually assigned to this day, named — so the card
          // says "تمام بدن / پشت" rather than making the user open it to
          // find out which plan is on it.
          const assigned = day.assignedVariantIds ?? [];
          // The default plan is named too. It used to be filtered out
          // entirely, so a day assigned only the default — even one
          // renamed to something meaningful like "سینه" — fell through to
          // the "انتخاب پلن" placeholder, as if nothing were assigned.
          const planNames = assigned
            .map((id) =>
              id === DEFAULT_VARIANT_ID
                ? day.workoutId
                  ? getDefaultPlanName(day.workoutId)
                  : undefined
                : getVariant(id)?.name,
            )
            .filter((name): name is string => Boolean(name));

          // One plan is named outright; several are counted, since a card
          // this size can't list them and the count is the useful part.
          // Nothing assigned says so explicitly rather than reading as a
          // vague invitation — the workout page will ask on the day.
          let planLabel =
            planNames.length === 0
              ? "حالت برنامه انتخاب نشده"
              : planNames.length === 1
                ? planNames[0]
                : "چند حالت انتخاب شده";

          // Today shows the plan actually in play, not the day's abstract
          // assignment: whatever was recorded if it's finished, otherwise
          // whatever was picked on the workout page. Changing the plan
          // there has to be visible here rather than leaving the calendar
          // insisting on something else.
          if (isToday && day.workoutId) {
            const pickedId = getCompletionFor(iso)?.variantId ?? todaysPick;
            const pickedName =
              pickedId === DEFAULT_VARIANT_ID
                ? getDefaultPlanName(day.workoutId)
                : pickedId
                  ? getVariant(pickedId)?.name
                  : undefined;

            if (pickedName) planLabel = pickedName;
          }

          return (
            <div
              key={day.id}
              className={`glass-panel glass-static flex h-full flex-col gap-2 rounded-2xl p-3 ${
                locked ? "opacity-60" : ""
              } ${isToday ? "glass-chip-selected" : ""}`}
            >
              {/* Date and workout share the top line — the title used to
                  sit in the middle of a square card, which made every card
                  taller than the little it actually has to say. */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-white">
                    {iso
                      ? formatWeekdayName(isoToLocalDate(iso))
                      : `روز ${toFaDigits(index + 1)}`}
                  </div>

                  <div className="truncate text-[10px] text-white/50">
                    {iso && formatDisplayShort(isoToLocalDate(iso))}
                    {isToday && " · امروز"}
                    {locked && " 🔒"}
                  </div>
                </div>

                <button
                  onClick={() => !locked && setPickerDayIndex(index)}
                  disabled={locked}
                  className="min-w-0 max-w-[55%] text-left disabled:opacity-100"
                >
                  <span className="line-clamp-2 text-xs font-bold text-white">
                    {day.workoutId ? day.title : "استراحت"}
                  </span>
                </button>
              </div>

              {/* mt-auto pins this row to the bottom, so cards of
                  differing content still line their controls up. */}
              <div className="mt-auto flex items-center justify-between gap-2">
                {/* Names the plan that's actually on this day rather than a
                    generic label, so the card answers "which one?" without
                    being opened. Only offered once the workout has a plan
                    beyond پیش‌فرض to rotate with. */}
                <div className="min-w-0">
                  {!locked && day.workoutId && getVariants(day.workoutId).length > 0 && (
                    <button
                      onClick={() => setVariantDayIndex(index)}
                      className="glass-tap glass-static block max-w-full truncate rounded-lg px-2 py-1 text-[10px] font-medium text-white/70"
                    >
                      {planLabel}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => removeDay(index)}
                  disabled={days.length <= 1 || locked}
                  className="shrink-0 px-1 text-[10px] font-medium text-red-400 disabled:opacity-30"
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two halves of one row — same shape and weight, since they're
          peers: one extends the cycle, the other says where it begins. */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={addDay}
          className="ghost-action rounded-2xl py-4 text-center text-sm font-medium text-white"
        >
          + افزودن روز تمرینی
        </button>

        <button
          onClick={() => setStartDateModalOpen(true)}
          className="ghost-action truncate rounded-2xl py-4 text-center text-sm font-medium text-white"
        >
          {startDate
            ? `شروع از ${formatDisplayShort(isoToLocalDate(startDate))}`
            : "روز شروع برنامه"}
        </button>
      </div>

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
