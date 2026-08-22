import { useEffect, useState } from "react";
import { BarChart3, Check, Minus, NotebookText, Plus, Timer, Trash2 } from "lucide-react";

import ExerciseProgressChartModal from "@/components/progress/ExerciseProgressChartModal";
import ModalOverlay from "@/components/ModalOverlay";
import {
  addSet,
  confirmSet,
  ensureTodaysSets,
  getPastSessions,
  getPersonalRecord,
  getPersonalRecordByDuration,
  removeSet,
  updateSet,
  type SetEntry,
} from "@/utils/exerciseSetLogEngine";
import { formatDisplayShort, isoToLocalDate } from "@/utils/dateFormat";
import { getAppSettings } from "@/utils/appSettingsEngine";
import { toFaDigits } from "@/utils/numberFormat";

const WEIGHT_STEP = 5;
const REPS_STEP = 1;

// A number field with ± buttons on either side, defaulting to the last
// real value entered (see addSet's own seeding) rather than starting
// blank — the arrows are the fast path (±step per tap), typing straight
// into the field is still there for an exact, arbitrary number.
function NumberStepper({
  value,
  step,
  disabled,
  onChange,
}: {
  value: number;
  step: number;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className="selector-pill flex items-center justify-between rounded-lg p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - step))}
        disabled={disabled}
        aria-label="کم کردن"
        className="flex h-6 w-6 shrink-0 items-center justify-center text-white disabled:opacity-40"
      >
        <Minus size={12} />
      </button>

      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full bg-transparent text-center text-sm text-white outline-none disabled:opacity-70"
      />

      <button
        type="button"
        onClick={() => onChange(value + step)}
        disabled={disabled}
        aria-label="زیاد کردن"
        className="flex h-6 w-6 shrink-0 items-center justify-center text-white disabled:opacity-40"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface ExerciseSetLoggerProps {
  exerciseId: string;
  exerciseName: string;
  // Isometric holds (پلانک and the like) are timed, not repeated — see
  // Exercise.unit in data/workoutLibrary. Defaults to "reps" so every
  // existing call site (none of which passed this before) keeps behaving
  // exactly as it always did.
  unit?: "reps" | "seconds";
  // The exercise's own configured set/rep count (ExerciseCard no longer
  // shows these directly — this is where they end up instead: seeding
  // today's log with exactly this many real rows the first time it's
  // opened, see ensureTodaysSets).
  defaultSets: number;
  defaultReps: number;
  // Per-set rep targets for a pyramid-style plan (see Exercise.repsPerSet)
  // — when given, today's rows are seeded one-to-one from it instead of
  // repeating defaultReps on every row.
  repsPerSet?: number[];
  // The exercise's own "what this trains and why" text (see
  // Exercise.description). Absent for anything not yet documented, in which
  // case the note button simply isn't offered.
  description?: string;
}

// The drawer under an exercise card on the daily workout page — opened by
// tapping the card anywhere but its toggle (see ExerciseCard). Everything
// here reads/writes exerciseSetLogEngine directly; there's no shared
// reactive store, so state is re-read after every mutation the same way
// the rest of this app's localStorage-backed screens already do.
export default function ExerciseSetLogger({
  exerciseId,
  exerciseName,
  unit = "reps",
  defaultSets,
  defaultReps,
  repsPerSet,
  description,
}: ExerciseSetLoggerProps) {
  const isSeconds = unit === "seconds";
  const repsLabel = isSeconds ? "ثانیه" : "تکرار";
  // Same ±5s vs ±1 rep convention the workout-library editor already uses
  // for this exact distinction (ExerciseEditRow in WorkoutDetailPage).
  const repsStep = isSeconds ? 5 : REPS_STEP;
  const [sets, setSets] = useState<SetEntry[]>(() =>
    ensureTodaysSets(exerciseId, defaultSets, defaultReps, repsPerSet),
  );
  // The wall-clock moment rest actually ends, not a countable "seconds
  // left" — a plain setTimeout-decrements-a-number timer only ever ticks
  // while a JS frame actually runs, so backgrounding the tab (throttled
  // timers) or locking the phone screen (JS fully suspended) freezes it in
  // place instead of continuing to count down; coming back showed a stale
  // number nowhere near the real elapsed time. Deriving the remaining time
  // from Date.now() on every tick — and immediately on visibilitychange,
  // rather than waiting for the next tick — means the moment the screen
  // unlocks the display jumps straight to the correct value (or finishes
  // outright if rest was already over while the phone was locked).
  const [restEndAt, setRestEndAt] = useState<number | null>(null);
  // Forces a re-render on every tick/visibility-change so the render-time
  // Math.ceil below recomputes against the current real time — nothing is
  // actually stored in this counter itself.
  const [, forceTick] = useState(0);
  const [chartOpen, setChartOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    if (restEndAt === null) return;

    function tick() {
      if (Date.now() >= restEndAt!) {
        setRestEndAt(null);
      } else {
        forceTick((n) => n + 1);
      }
    }

    const interval = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [restEndAt]);

  const restSecondsLeft =
    restEndAt === null ? null : Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000));

  const pastSessions = getPastSessions(exerciseId, 10);
  // Isometric holds record their PR by longest duration, not heaviest
  // weight (usually 0) — see getPersonalRecordByDuration.
  const pr = isSeconds ? getPersonalRecordByDuration(exerciseId) : getPersonalRecord(exerciseId);

  function handleAddSet() {
    setSets(addSet(exerciseId));
  }

  function handleUpdateSet(setId: string, patch: Partial<Pick<SetEntry, "weight" | "reps">>) {
    setSets(updateSet(exerciseId, setId, patch));
  }

  function handleConfirmSet(setId: string) {
    setSets(confirmSet(exerciseId, setId));
    // Read fresh on every confirm rather than once — the settings popup's
    // own "ذخیره" reloads the page after saving, but reading it live here
    // costs nothing and needs no invalidation either way.
    setRestEndAt(Date.now() + getAppSettings().restSeconds * 1000);
  }

  function handleRemoveSet(setId: string) {
    setSets(removeSet(exerciseId, setId));
  }

  return (
    <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">ثبت ست‌های امروز</h3>

          <div className="flex items-center gap-1.5">
            {description && (
              <button
                onClick={() => setNoteOpen(true)}
                aria-label="توضیح حرکت"
                className="glass-chip glass-static flex h-8 w-8 items-center justify-center rounded-full text-white"
              >
                <NotebookText size={14} />
              </button>
            )}

            <button
              onClick={() => setChartOpen(true)}
              aria-label="نمودار پیشرفت"
              className="glass-chip glass-static flex h-8 w-8 items-center justify-center rounded-full text-white"
            >
              <BarChart3 size={14} />
            </button>
          </div>
        </div>

        {restSecondsLeft !== null && (
          <div className="mb-3 glass-chip glass-static flex items-center justify-center gap-2 rounded-xl p-2 text-sm font-semibold text-avocado-yellow">
            <Timer size={14} />
            استراحت: {toFaDigits(formatMMSS(restSecondsLeft))}
          </div>
        )}

        {sets.length > 0 && (
          <div className="mb-2 grid grid-cols-[24px_1fr_1fr_36px_28px] gap-2 px-1 text-xs text-white/50">
            <span>ست</span>
            <span>وزنه (kg)</span>
            <span>{repsLabel}</span>
            <span>تایید</span>
            <span />
          </div>
        )}

        <div className="space-y-2">
          {sets.map((set, index) => (
            <div
              key={set.id}
              className={`glass-chip glass-static grid grid-cols-[24px_1fr_1fr_36px_28px] items-center gap-2 rounded-xl p-2 ${
                set.confirmed ? "opacity-60" : ""
              }`}
            >
              <span className="text-center text-sm font-medium text-white">
                {toFaDigits(index + 1)}
              </span>

              <NumberStepper
                value={set.weight}
                step={WEIGHT_STEP}
                disabled={set.confirmed}
                onChange={(weight) => handleUpdateSet(set.id, { weight })}
              />

              <NumberStepper
                value={set.reps}
                step={repsStep}
                disabled={set.confirmed}
                onChange={(reps) => handleUpdateSet(set.id, { reps })}
              />

              <button
                onClick={() => handleConfirmSet(set.id)}
                disabled={set.confirmed}
                aria-label={`تایید ست ${toFaDigits(index + 1)}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  set.confirmed
                    ? "bg-avocado-lime/20 text-avocado-lime"
                    : "glass-action glass-action-static text-white"
                }`}
              >
                <Check size={16} />
              </button>

              {/* Deleting stays available even after confirming a set —
                  the whole point is fixing a wrong entry, and a mistake
                  isn't necessarily caught before it's confirmed. */}
              <button
                onClick={() => handleRemoveSet(set.id)}
                aria-label={`حذف ست ${toFaDigits(index + 1)}`}
                className="flex h-8 w-8 items-center justify-center text-white/40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddSet}
          className="glass-tap glass-static mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-white/70"
        >
          <Plus size={14} />
          افزودن ست جدید
        </button>
      </div>

      {pr && (
        <div className="glass-chip glass-static flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold text-avocado-yellow">
          🏆 رکورد شخصی (PR):{" "}
          {isSeconds
            ? `${toFaDigits(pr.reps)} ثانیه`
            : `${toFaDigits(pr.weight)} کیلوگرم`}{" "}
          (ثبت‌شده در {formatDisplayShort(isoToLocalDate(pr.date))})
        </div>
      )}

      {pastSessions.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">تاریخچه جلسات قبلی</h3>

          <div className="max-h-40 space-y-2 overflow-y-auto">
            {pastSessions.map((session, index) => (
              <div
                key={session.date}
                className="glass-chip glass-static rounded-xl p-2.5 text-xs leading-6 text-white"
              >
                <span className="text-white/60">
                  {index === 0 ? "جلسه قبل" : "جلسه قبل‌تر"} ({formatDisplayShort(isoToLocalDate(session.date))}):{" "}
                </span>

                {session.sets
                  .filter((set) => set.confirmed)
                  .map(
                    (set, i) =>
                      `ست ${toFaDigits(i + 1)}: ${toFaDigits(set.weight)}kg × ${toFaDigits(set.reps)} ${repsLabel}`,
                  )
                  .join(" | ")}
              </div>
            ))}
          </div>
        </div>
      )}

      {noteOpen && description && (
        <ModalOverlay onClose={() => setNoteOpen(false)}>
          <div className="glass-panel glass-static space-y-4 rounded-3xl p-6">
            <h2 className="text-center text-base font-bold text-white">{exerciseName}</h2>

            <p className="text-sm leading-7 text-white/80">{description}</p>

            <button
              onClick={() => setNoteOpen(false)}
              className="ghost-action ghost-action-static w-full rounded-2xl py-3 font-medium text-white"
            >
              بستن
            </button>
          </div>
        </ModalOverlay>
      )}

      <ExerciseProgressChartModal
        open={chartOpen}
        onClose={() => setChartOpen(false)}
        exerciseId={exerciseId}
        exerciseName={exerciseName}
      />
    </div>
  );
}
