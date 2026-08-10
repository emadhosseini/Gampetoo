import { scopedKey } from "./userEngine";

const STORAGE_KEY = "emad-app-settings";

export type Theme = "dark" | "light";
export type Language = "fa" | "en";
export type WeightUnit = "kg" | "lb";
export type WeekStart = "saturday" | "monday";

export interface AppSettings {
  theme: Theme;
  language: Language;
  weightUnit: WeightUnit;
  weekStart: WeekStart;
  // Default rest timer length, seconds — ExerciseSetLogger's own
  // REST_SECONDS constant is the fallback until this reads from here.
  restSeconds: number;
}

// Dark/فارسی/kg/شنبه/۹۰s — exactly what the app already behaved as before
// any of this was a real setting, so an account with nothing saved yet
// looks identical to how it always did.
const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  language: "fa",
  weightUnit: "kg",
  weekStart: "saturday",
  restSeconds: 90,
};

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

export function saveAppSettings(settings: AppSettings) {
  localStorage.setItem(storageKey(), JSON.stringify(settings));
}

export function resetAppSettings() {
  localStorage.removeItem(storageKey());
}
