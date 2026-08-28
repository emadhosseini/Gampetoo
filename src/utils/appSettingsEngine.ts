import { scopedKey } from "./userEngine";

const STORAGE_KEY = "emad-app-settings";

export type Theme = "dark" | "light";
export type Language = "fa" | "en";
export type WeightUnit = "kg" | "lb";
export type WeekStart = "saturday" | "monday";
// How a meal card starts out: "auto" is the behaviour that predates this
// setting — open when the meal already has something in it, closed
// otherwise — while the other two are the user overriding that outright.
export type MealCardDefault = "auto" | "expanded" | "collapsed";

export interface AppSettings {
  theme: Theme;
  language: Language;
  weightUnit: WeightUnit;
  weekStart: WeekStart;
  // Default rest timer length, seconds — ExerciseSetLogger's own
  // REST_SECONDS constant is the fallback until this reads from here.
  restSeconds: number;
  // Meal slots (by id — see foodCatalog's getMealSlots) the user doesn't
  // want to see. Not everyone eats to a nine-slot day: "بعد از بیدار شدن"
  // and "قبل تمرین" are noise for most, and scrolling past empty cards
  // every day is what this removes. Hiding only affects what's displayed —
  // anything already logged or planned under a hidden slot is kept, and
  // reappears the moment it's shown again.
  hiddenMealIds: string[];
  mealCardDefault: MealCardDefault;
}

// Dark/فارسی/kg/شنبه/۹۰s — exactly what the app already behaved as before
// any of this was a real setting, so an account with nothing saved yet
// looks identical to how it always did.
const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  language: "fa",
  weightUnit: "kg",
  weekStart: "monday",
  restSeconds: 90,
  hiddenMealIds: [],
  mealCardDefault: "auto",
};

// Date.getDay()'s own 0=Sunday..6=Saturday numbering — what every week-
// bucketing calculation (StatChartPage's "هفته" range) actually needs,
// rather than the "saturday"/"monday" strings this setting is stored and
// shown as.
export function weekStartDayNumber(weekStart: WeekStart): number {
  return weekStart === "saturday" ? 6 : 1;
}

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

export function getAppSettings(): AppSettings {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = { ...DEFAULT_SETTINGS, ...(JSON.parse(saved) as Partial<AppSettings>) };

    // زبان" is disabled in SettingsSidebar (i18n coverage is still
    // partial), but a few accounts saved "en" back when that row was
    // briefly selectable — forcing fa here brings every account back to
    // Persian regardless of what it saved earlier, until the language
    // switch is actually finished and re-enabled.
    return { ...parsed, language: "fa" };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// The two nutrition-display settings on their own, since every screen that
// reads them wants exactly these and nothing else. Guarded against a saved
// value of the wrong shape (an older build, a half-written sync) rather
// than trusting the blob — a non-array here would break every meal list at
// once.
export function getMealDisplaySettings(): {
  hiddenMealIds: string[];
  mealCardDefault: MealCardDefault;
} {
  const { hiddenMealIds, mealCardDefault } = getAppSettings();

  return {
    hiddenMealIds: Array.isArray(hiddenMealIds) ? hiddenMealIds : [],
    mealCardDefault:
      mealCardDefault === "expanded" || mealCardDefault === "collapsed"
        ? mealCardDefault
        : "auto",
  };
}

/** Whether a meal card should start open, given what's already in it. */
export function shouldMealCardStartOpen(hasContent: boolean): boolean {
  const { mealCardDefault } = getMealDisplaySettings();

  if (mealCardDefault === "expanded") return true;
  if (mealCardDefault === "collapsed") return false;

  return hasContent;
}

export function saveAppSettings(settings: AppSettings) {
  localStorage.setItem(storageKey(), JSON.stringify(settings));
}

export function resetAppSettings() {
  localStorage.removeItem(storageKey());
}
