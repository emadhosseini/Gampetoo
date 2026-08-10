import { useState } from "react";
import { Activity, ChevronDown, Flame, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import PillTabBar, { type PillTabBarItem } from "@/components/PillTabBar";
import MealLogCard from "@/components/nutrition/MealLogCard";
import DailyTotalsCard from "@/components/nutrition/DailyTotalsCard";
import WeeklyDatePicker from "@/components/nutrition/WeeklyDatePicker";
import MealAddChoiceModal from "@/components/nutrition/MealAddChoiceModal";
import AddMealEntryModal from "@/components/nutrition/AddMealEntryModal";
import AiMealEntryModal from "@/components/nutrition/AiMealEntryModal";
import EditMealEntryModal from "@/components/nutrition/EditMealEntryModal";
import ActivityLogModal from "@/components/progress/ActivityLogModal";
import {
  DAILY_MODE_SLOT,
  getMealSlots,
  type MealSlot,
} from "@/data/nutrition/foodCatalog";
import {
  getCalorieTrackingMode,
  setCalorieTrackingMode,
  type CalorieTrackingMode,
} from "@/utils/calorieModeEngine";
import {
  removeLoggedEntry,
  updateLoggedEntryQuantity,
  type LoggedFoodEntry,
} from "@/utils/dailyLogEngine";
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

type Tab = "meal" | "activity";

const tabs: PillTabBarItem<Tab>[] = [
  { id: "meal", label: "وعده غذایی", icon: UtensilsCrossed },
  { id: "activity", label: "فعالیت", icon: Activity },
];

// Where calories eaten and exercise/activity done get logged. This page
// replaces the old settings hub (its nav shortcuts all now live in
// SideMenu/ProfilePage).
export default function DailyLogPage() {
  const [tab, setTab] = useState<Tab>("meal");

  return (
    <div>
      <PillTabBar
        items={tabs}
        active={tab}
        onChange={setTab}
        layoutId="daily-log-tab-selection"
      />

      {tab === "meal" ? <MealTabRoot /> : <ActivityTabRoot />}
    </div>
  );
}

// Two numbers, kept as separate cards because they come from separate
// sources: the first is a pure report (no add button — see
// sessionEngine.ts's toggleExerciseChecked, which is the only thing that
// ever changes it), the second is manually logged the same way it already
// was before workout-derived calories existed (ActivityLogModal, also
// reachable from the quick-add drawer).
function ActivityTabRoot() {
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [, setVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);

  const isToday = selectedDate === getTodayLocalDate();
  const workoutCalories = getWorkoutCalories(selectedDate);
  const manualCalories = getActivityCalories(selectedDate);
  // Re-read on every render — version/selectedDate changes force this
  // component to re-render, and this reads straight from localStorage each
  // time with no memoization, same "no reactive store" pattern the rest of
  // this page already uses.
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

// "سایر فعالیت‌ها" — same interaction shape as MealLogCard: tapping the
// card anywhere except the "+" expands it in place to list every activity
// logged that day (with or without a note), instead of only ever showing
// the noted ones underneath as a separate, always-open block.
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

// Reads the saved calorie-tracking mode and either prompts the user to pick
// one (first visit) or renders MealLogTab with the slot list that mode
// implies. Both modes share the exact same storage/components — the mode
// only decides which slot ids MealLogTab loops over.
function MealTabRoot() {
  const [mode, setMode] = useState(() => getCalorieTrackingMode());
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);

  if (mode === null) {
    return <CalorieModeChoicePrompt onChoose={setMode} />;
  }

  return (
    <>
      <WeeklyDatePicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <MealLogTab
        slots={mode === "daily" ? [DAILY_MODE_SLOT] : getMealSlots()}
        mode={mode}
        date={selectedDate}
      />
    </>
  );
}

function CalorieModeChoicePrompt({
  onChoose,
}: {
  onChoose: (mode: CalorieTrackingMode) => void;
}) {
  function choose(mode: CalorieTrackingMode) {
    setCalorieTrackingMode(mode);
    onChoose(mode);
  }

  return (
    <div className="space-y-4 px-5 pb-5 pt-6 text-center">
      <p className="text-white">
        اول انتخاب کن که می‌خوای کالری رو چه‌طوری ثبت کنی — هر وقت خواستی
        از منوی کناری می‌تونی عوضش کنی.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => choose("perMeal")}
          className="glass-tap selector-pill flex-1 rounded-xl py-4 font-bold text-white"
        >
          وعده‌ای
        </button>

        <button
          onClick={() => choose("daily")}
          className="glass-tap selector-pill flex-1 rounded-xl py-4 font-bold text-white"
        >
          روزانه
        </button>
      </div>
    </div>
  );
}

type ModalScreen =
  | { meal: MealSlot; screen: "choice" | "add" | "ai" }
  | { meal: MealSlot; screen: "edit"; entry: LoggedFoodEntry }
  | null;

// Fully independent of the prescribed nutrition plan (program.nutrition) —
// this logs whatever the user actually ate against a fixed catalog of
// meal-time slots (صبحانه، ناهار، ...), or a single unified slot for
// "daily" mode.
//
// Nothing here opens a read-only summary any more: what's logged for a meal
// is shown by expanding the card itself, and the only modals left are the
// ones that actually do something. "+" opens the choice of how to add
// (MealAddChoiceModal), which drills one level deeper into either the manual
// food-search screen (AddMealEntryModal) or the AI free-text screen
// (AiMealEntryModal); tapping a food inside an expanded card opens its
// amount editor. "بستن" on either add screen closes everything straight back
// to this list, not one level back to the choice — closing there means
// "I'm done", not "go back".
function MealLogTab({
  slots,
  mode,
  date,
}: {
  slots: MealSlot[];
  mode: CalorieTrackingMode;
  // The WeeklyDatePicker selection from MealTabRoot above — every read/
  // write in this tab now happens against this date instead of always
  // "today".
  date: string;
}) {
  const [modal, setModal] = useState<ModalScreen>(null);
  // Bumped after every add/edit/remove so the cards — which read straight
  // from localStorage, with no reactive store in between — look again.
  const [version, setVersion] = useState(0);

  function refresh() {
    setVersion((v) => v + 1);
  }

  const editing = modal?.screen === "edit" ? modal : null;
  const isToday = date === getTodayLocalDate();

  return (
    // pt-3 rather than the pt-6 every other tab's root uses — WeeklyDatePicker
    // sits directly above this (its own px-5 pt-4), so the usual top padding
    // here stacked with that into a much bigger gap than any other page has.
    <div className="space-y-4 px-5 pb-5 pt-3">
      {/* Now rendered in both modes: it used to be per-meal only, since
          daily mode's single card below was already showing exactly these
          numbers — now that card's own totals are hidden (see hideTotals
          below), so this is the only place either mode shows them. */}
      <DailyTotalsCard slots={slots} version={version} date={date} isToday={isToday} />

      {slots.map((meal) => (
        <MealLogCard
          key={meal.id}
          meal={meal}
          version={version}
          date={date}
          // Daily mode's one slot is internally still "کالری روزانه" (used
          // by the quick-add flow's own heading) — this is just what shows
          // on the card here, now that it's a plain list of today's meals
          // rather than a calorie summary.
          title={mode === "daily" ? (isToday ? "وعده‌های غذایی امروز" : "وعده‌های غذایی این روز") : undefined}
          // DailyTotalsCard above carries the totals for both modes now.
          hideTotals={mode === "daily"}
          onAdd={(meal) => setModal({ meal, screen: "choice" })}
          onEditEntry={(meal, entry) =>
            setModal({ meal, screen: "edit", entry })
          }
        />
      ))}

      <MealAddChoiceModal
        meal={modal?.screen === "choice" ? modal.meal : null}
        onClose={() => setModal(null)}
        onAdd={() => setModal(modal && { meal: modal.meal, screen: "add" })}
        onAddAi={() => setModal(modal && { meal: modal.meal, screen: "ai" })}
      />

      <AddMealEntryModal
        meal={modal?.screen === "add" ? modal.meal : null}
        onClose={() => setModal(null)}
        onChange={refresh}
        date={date}
      />

      <AiMealEntryModal
        meal={modal?.screen === "ai" ? modal.meal : null}
        onClose={() => setModal(null)}
        onChange={refresh}
        date={date}
      />

      <EditMealEntryModal
        meal={editing?.meal ?? null}
        entry={editing?.entry ?? null}
        onClose={() => setModal(null)}
        onSave={(quantity) => {
          if (!editing) return;
          updateLoggedEntryQuantity(editing.meal.id, editing.entry.id, quantity, date);
          refresh();
          setModal(null);
        }}
        onRemove={() => {
          if (!editing) return;
          removeLoggedEntry(editing.meal.id, editing.entry.id, date);
          refresh();
          setModal(null);
        }}
      />
    </div>
  );
}
