import { useState } from "react";
import { ChevronDown, Flame, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import WeeklyDatePicker from "@/components/nutrition/WeeklyDatePicker";
import ActivityLogModal from "@/components/progress/ActivityLogModal";
import {
  getActivityCalories,
  getActivityEntries,
  logActivityEntry,
  removeActivityEntry,
  type ActivityNoteEntry,
} from "@/utils/activityLogEngine";
import { getWorkoutCalories } from "@/utils/workoutCalorieEngine";
import { getTodayLocalDate } from "@/utils/dateFormat";
import { toFaDigits } from "@/utils/numberFormat";

// Shared Activity tab — rendered inside DailyProgramPage ("تمرین") on native
// iOS and inside DailyLogPage ("ثبت روزانه") on Web.
export default function ActivityTabRoot() {
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [, setVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);

  const isToday = selectedDate === getTodayLocalDate();
  const workoutCalories = getWorkoutCalories(selectedDate);
  const manualCalories = getActivityCalories(selectedDate);
  const entries = getActivityEntries(selectedDate);

  return (
    <>
      <WeeklyDatePicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="space-y-4 px-5 pb-5 pt-3">
        <div className="glass-panel rounded-3xl p-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
            <Flame size={20} />
          </div>

          <p className="mt-3 font-semibold text-white">
            {isToday ? "کالری سوخته‌شده برنامه تمرینی روزانه" : "کالری سوخته‌شده برنامه تمرینی این روز"}
          </p>

          <p className="mt-1 text-3xl font-bold text-white">
            {toFaDigits(workoutCalories)}
          </p>

          <p className="text-sm text-white/60">کالری</p>
        </div>

        <OtherActivitiesCard
          manualCalories={manualCalories}
          entries={entries}
          onAdd={() => setActivityModalOpen(true)}
          onRemove={(id) => {
            removeActivityEntry(id);
            setVersion((v) => v + 1);
          }}
        />

        <ActivityLogModal
          open={activityModalOpen}
          onClose={() => setActivityModalOpen(false)}
          onLog={(calories, note) => {
            logActivityEntry(calories, note, selectedDate);
            setVersion((v) => v + 1);
          }}
        />
      </div>
    </>
  );
}

function OtherActivitiesCard({
  manualCalories,
  entries,
  onAdd,
  onRemove,
}: {
  manualCalories: number;
  entries: ActivityNoteEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-panel glass-static overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-3 p-5">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex-1 text-right"
        >
          <p className="font-semibold text-white">سایر فعالیت‌ها</p>

          <p className="mt-1 text-sm text-white/70">
            {manualCalories > 0
              ? `${toFaDigits(manualCalories)} کالری ثبت‌شده`
              : "چیزی ثبت نشده"}
          </p>
        </button>

        <button
          onClick={onAdd}
          aria-label="افزودن فعالیت"
          className="glass-action flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
        >
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && entries.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="max-h-64 space-y-2 overflow-y-auto px-5 pb-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="glass-chip flex items-center justify-between gap-2 rounded-xl p-3 text-right"
                >
                  <p className="flex-1 text-sm text-white">
                    {entry.note || "فعالیت بدون یادداشت"}
                  </p>

                  <span className="shrink-0 text-xs text-white/70">
                    {toFaDigits(entry.calories)} کالری
                  </span>

                  <button
                    onClick={() => onRemove(entry.id)}
                    aria-label="حذف فعالیت"
                    className="shrink-0 text-white/40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "بستن فعالیت‌ها" : "نمایش فعالیت‌ها"}
          aria-expanded={expanded}
          className="glass-tap flex w-full items-center justify-center py-1.5 text-white/60"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
