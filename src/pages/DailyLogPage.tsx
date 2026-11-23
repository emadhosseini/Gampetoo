import { useState } from "react";
import {
  Activity,
  BookOpen,
  Pencil,
  UtensilsCrossed,
} from "lucide-react";

import PillTabBar, { type PillTabBarItem } from "@/components/PillTabBar";
import MealLogCard from "@/components/nutrition/MealLogCard";
import DailyTotalsCard from "@/components/nutrition/DailyTotalsCard";
import WeeklyDatePicker from "@/components/nutrition/WeeklyDatePicker";
import MealAddChoiceModal from "@/components/nutrition/MealAddChoiceModal";
import MealDisplaySettingsModal from "@/components/nutrition/MealDisplaySettingsModal";
import AddMealEntryModal from "@/components/nutrition/AddMealEntryModal";
import AiMealEntryModal from "@/components/nutrition/AiMealEntryModal";
import ManualMacroEntryModal from "@/components/nutrition/ManualMacroEntryModal";
import EditMealEntryModal from "@/components/nutrition/EditMealEntryModal";
import ActivityTabRoot from "@/components/progress/ActivityTabRoot";
import { isNativeIos } from "@/native/platform";
import NutritionPage from "@/pages/NutritionPage";
import {
  DAILY_MODE_SLOT,
  getMealSlots,
  type MealSlot,
} from "@/data/nutrition/foodCatalog";
import { visibleMealSlots } from "@/domain/nutrition/mealVisibility";
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
import { getTodayLocalDate, isoToLocalDate } from "@/utils/dateFormat";

type WebTab = "meal" | "activity";
type IosTab = "meal" | "nutrition";

const webTabs: PillTabBarItem<WebTab>[] = [
  { id: "meal", label: "وعده غذایی", icon: UtensilsCrossed },
  { id: "activity", label: "فعالیت", icon: Activity },
];

const iosTabs: PillTabBarItem<IosTab>[] = [
  { id: "meal", label: "وعده غذایی", icon: UtensilsCrossed },
  { id: "nutrition", label: "برنامه غذایی", icon: BookOpen },
];

// Where calories eaten and exercise/activity done get logged (on native iOS,
// this tab is "تغذیه": Meal Log + Nutrition Plan, while Activity lives under
// "تمرین" alongside the daily workout).
export default function DailyLogPage() {
  const nativeIos = isNativeIos();
  const [webTab, setWebTab] = useState<WebTab>("meal");
  const [iosTab, setIosTab] = useState<IosTab>("meal");

  if (nativeIos) {
    return (
      <div>
        <PillTabBar
          items={iosTabs}
          active={iosTab}
          onChange={setIosTab}
          layoutId="daily-log-tab-selection"
        />

        {iosTab === "meal" ? <MealTabRoot /> : <NutritionPage />}
      </div>
    );
  }

  return (
    <div>
      <PillTabBar
        items={webTabs}
        active={webTab}
        onChange={setWebTab}
        layoutId="daily-log-tab-selection"
      />

      {webTab === "meal" ? <MealTabRoot /> : <ActivityTabRoot />}
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
  const [displayOpen, setDisplayOpen] = useState(false);
  // Bumped when the display settings are saved. Which meals show and how
  // their cards open are both read during render straight from storage,
  // and the slot list below is rebuilt from that read.
  const [displayVersion, setDisplayVersion] = useState(0);

  if (mode === null) {
    return <CalorieModeChoicePrompt onChoose={setMode} />;
  }

  // Daily mode has one pseudo-slot and nothing to hide — filtering only
  // ever applies to the real per-meal list. Resolved against the selected
  // date, not today, so looking back at a rest day shows that day's meals.
  const slots =
    mode === "daily"
      ? [DAILY_MODE_SLOT]
      : visibleMealSlots(isoToLocalDate(selectedDate));

  return (
    <>
      <WeeklyDatePicker
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        trailing={
          // Same pencil, same size and shape as the workout page's own
          // header action — the two pages' top rows should read as the
          // same control, not two different ideas.
          <button
            onClick={() => setDisplayOpen(true)}
            aria-label="تنظیم نمایش وعده‌های غذایی"
            className="glass-chip glass-static flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          >
            <Pencil size={15} />
          </button>
        }
      />

      <MealLogTab
        key={displayVersion}
        slots={slots}
        // Totals are summed over every slot, hidden ones included: hiding
        // is about what's on screen, and a day's calories must not change
        // because a card was tidied away — the calorie orb on the progress
        // page counts them regardless, and the two disagreeing would be
        // worse than either.
        totalSlots={mode === "daily" ? [DAILY_MODE_SLOT] : getMealSlots()}
        mode={mode}
        date={selectedDate}
      />

      <MealDisplaySettingsModal
        open={displayOpen}
        onClose={() => setDisplayOpen(false)}
        onSaved={() => setDisplayVersion((v) => v + 1)}
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
  | { meal: MealSlot; screen: "choice" | "add" | "ai" | "manual" }
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
  totalSlots,
  mode,
  date,
}: {
  slots: MealSlot[];
  // Every slot, including any the user has hidden — see the call site.
  totalSlots: MealSlot[];
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
      <DailyTotalsCard slots={totalSlots} version={version} date={date} isToday={isToday} />

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
        onAddManual={() => setModal(modal && { meal: modal.meal, screen: "manual" })}
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

      <ManualMacroEntryModal
        meal={modal?.screen === "manual" ? modal.meal : null}
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
