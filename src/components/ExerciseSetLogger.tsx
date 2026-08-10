import { useEffect, useState } from "react";
import { BarChart3, Check, Minus, Plus, Timer } from "lucide-react";

import ExerciseProgressChartModal from "@/components/progress/ExerciseProgressChartModal";
import {
  addSet,
  confirmSet,
  getPastSessions,
  getPersonalRecord,
  getTodaysSets,
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
}

// The drawer under an exercise card on the daily workout page — opened by
// tapping the card anywhere but its toggle (see ExerciseCard). Everything
// here reads/writes exerciseSetLogEngine directly; there's no shared
// reactive store, so state is re-read after every mutation the same way
// the rest of this app's localStorage-backed screens already do.
export default function ExerciseSetLogger({
  exerciseId,
  exerciseName,
}: ExerciseSetLoggerProps) {
  const [sets, setSets] = useState<SetEntry[]>(() => getTodaysSets(exerciseId));
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [chartOpen, setChartOpen] = useState(false);

  useEffect(() => {
    if (restSecondsLeft === null) return;

    if (restSecondsLeft <= 0) {
      setRestSecondsLeft(null);
      return;
    }

    const timer = setTimeout(() => setRestSecondsLeft((s) => (s ?? 0) - 1), 1000);

    return () => clearTimeout(timer);
  }, [restSecondsLeft]);

  const pastSessions = getPastSessions(exerciseId, 10);
  const pr = getPersonalRecord(exerciseId);

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
    setRestSecondsLeft(getAppSettings().restSeconds);
  }

  return (
    <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">ثبت ست‌های امروز</h3>

          <button
            onClick={() => setChartOpen(true)}
            aria-label="نمودار پیشرفت"
            className="glass-chip glass-static flex h-8 w-8 items-center justify-center rounded-full text-white"
          >
            <BarChart3 size={14} />
          </button>
        </div>

        {restSecondsLeft !== null && (
          <div className="mb-3 glass-chip glass-static flex items-center justify-center gap-2 rounded-xl p-2 text-sm font-semibold text-avocado-yellow">
            <Timer size={14} />
            استراحت: {toFaDigits(formatMMSS(restSecondsLeft))}
          </div>
        )}

        {sets.length > 0 && (
          <div className="mb-2 grid grid-cols-[28px_1fr_1fr_40px] gap-2 px-1 text-xs text-white/50">
            <span>ست</span>
            <span>وزنه (kg)</span>
            <span>تکرار</span>
            <span>تایید</span>
          </div>
        )}

        <div className="space-y-2">
          {sets.map((set, index) => (
            <div
              key={set.id}
              className={`glass-chip glass-static grid grid-cols-[28px_1fr_1fr_40px] items-center gap-2 rounded-xl p-2 ${
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
                step={REPS_STEP}
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
          🏆 رکورد شخصی (PR): {toFaDigits(pr.weight)} کیلوگرم (ثبت‌شده در{" "}
          {formatDisplayShort(isoToLocalDate(pr.date))})
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
                      `ست ${toFaDigits(i + 1)}: ${toFaDigits(set.weight)}kg × ${toFaDigits(set.reps)}`,
                  )
                  .join(" | ")}
              </div>
            ))}
          </div>
        </div>
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
