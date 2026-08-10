import { scopedKey } from "./userEngine";
import { getAppSettings } from "./appSettingsEngine";

const STORAGE_KEY = "emad-calendar-preference";

export type CalendarPreference = "jalali" | "gregorian";

export function getPreferredCalendar(): CalendarPreference {
  const saved = localStorage.getItem(scopedKey(STORAGE_KEY));

  if (saved === "gregorian" || saved === "jalali") return saved;

  // Nothing explicitly chosen in settings yet — follow the language:
  // fa defaults to jalali (the app's long-standing behavior before this
  // setting existed), en defaults to gregorian. Once the user actually
  // picks one in تنظیمات (setPreferredCalendar), that choice sticks
  // regardless of language.
  return getAppSettings().language === "en" ? "gregorian" : "jalali";
}

export function setPreferredCalendar(calendar: CalendarPreference) {
  localStorage.setItem(scopedKey(STORAGE_KEY), calendar);
}

export function resetCalendarPreference() {
  localStorage.removeItem(scopedKey(STORAGE_KEY));
}
