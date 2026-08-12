import { useState } from "react";
import { CalendarRange, Dumbbell, Footprints } from "lucide-react";
import { motion } from "framer-motion";

import ModalOverlay from "@/components/ModalOverlay";
import { getProgramDay, hasProgramStarted } from "@/utils/programEngine";
import { getSession } from "@/utils/sessionEngine";
import { DEFAULT_VARIANT_ID, getVariant } from "@/store/workoutVariantStore";
import {
  formatDisplayDayNumber,
  formatWeekdayName,
  toLocalDateString,
} from "@/utils/dateFormat";

// Which variant name (if any) to show in parens next to a day's title.
// assignedVariantIds is static program config, available for any date — but
// which variant was actually picked only exists for TODAY (sessionEngine's
// single un-dated selectedVariantId slot). So: a single assigned variant is
// shown for any day (deterministic), while 2+ assigned variants only
// resolve to a name on today, from the same session pick WorkoutPage itself
// uses — other days with 2+ options are genuinely unknown and show nothing.
function resolveVariantName(assignedVariantIds: string[], isToday: boolean): string | undefined {
  let variantId: string | null = null;

  if (assignedVariantIds.length === 1) {
    variantId = assignedVariantIds[0];
  } else if (assignedVariantIds.length > 1 && isToday) {
    variantId = getSession().selectedVariantId;
  }

  if (!variantId || variantId === DEFAULT_VARIANT_ID) return undefined;

  return getVariant(variantId)?.name;
}

const DAYS_BEFORE_TODAY = 3;
const DAYS_AFTER_TODAY = 7;

function buildWeekRange(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: Date[] = [];

  for (let offset = -DAYS_BEFORE_TODAY; offset <= DAYS_AFTER_TODAY; offset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    dates.push(date);
  }

  return dates;
}

/**
 * "تقویم هفته" — a pure read-only preview of the program's cycle across a
 * 10-day window (3 days back, 7 ahead), opened from a button on the
 * workout page. Deliberately does nothing but display: unlike
 * WeeklyDatePicker (the daily-log page's own calendar button), tapping a
 * row here doesn't navigate or change what any other page shows — this
 * exists purely so "what's my program doing this week" has one glance-
 * able answer instead of paging through days one at a time.
 */
export default function WeeklyScheduleModal() {
  const [open, setOpen] = useState(false);

  const todayIso = toLocalDateString(new Date());
  const dates = open ? buildWeekRange() : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass-chip glass-static flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-medium text-white"
      >
        <CalendarRange size={16} className="text-white/60" />
        تقویم هفته
      </button>

      {open && (
        <ModalOverlay onClose={() => setOpen(false)}>
          <div className="glass-panel glass-static w-full space-y-4 rounded-3xl p-6">
            <div className="text-center">
              <h2 className="text-lg font-bold text-white">تقویم هفته</h2>
              <p className="mt-1 text-xs text-white/50">
                برنامه‌ی ۳ روز قبل تا ۷ روز آینده
              </p>
            </div>

            <div className="-mx-1 max-h-[60vh] space-y-2 overflow-y-auto px-1">
              {dates.map((date, index) => {
                const iso = toLocalDateString(date);
                const isToday = iso === todayIso;
                const isPast = iso < todayIso;
                const started = hasProgramStarted(date);
                const day = started ? getProgramDay(date) : null;
                const isWorkout = day?.activity === "workout";
                const variantName =
                  isWorkout && day
                    ? resolveVariantName(day.assignedVariantIds ?? [], isToday)
                    : undefined;

                return (
                  <motion.div
                    key={iso}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.25 }}
                    className={`flex items-center gap-3 rounded-2xl p-3.5 ${
                      isToday
                        ? "glass-selected"
                        : isPast
                          ? "glass-chip opacity-50"
                          : "glass-chip"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-center ${
                        isToday ? "bg-avocado-yellow/20" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`text-base font-bold leading-tight ${
                          isToday ? "text-avocado-yellow" : "text-white"
                        }`}
                      >
                        {formatDisplayDayNumber(date)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 text-right">
                      <p className="truncate text-sm font-semibold text-white">
                        {!started
                          ? "شروع نشده"
                          : isWorkout
                            ? (day?.title ?? "تمرین")
                            : "استراحت"}
                        {variantName && (
                          <span className="text-xs font-normal text-white/50">
                            {" "}
                            ({variantName})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-white/50">
                        {formatWeekdayName(date)}
                        {isToday && " · امروز"}
                      </p>
                    </div>

                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        !started
                          ? "bg-white/5 text-white/30"
                          : isWorkout
                            ? "bg-avocado-lime/15 text-avocado-lime"
                            : "bg-white/10 text-white/60"
                      }`}
                    >
                      {isWorkout ? <Dumbbell size={16} /> : <Footprints size={16} />}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
            >
              بستن
            </button>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}
