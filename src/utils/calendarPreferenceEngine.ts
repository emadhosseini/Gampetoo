import { scopedKey } from "./userEngine";

const STORAGE_KEY = "emad-calendar-preference";

export type CalendarPreference = "jalali" | "gregorian";

// Jalali (شمسی) is the app's long-standing default — every date display
// already used it before this setting existed, so an account with no
// saved preference yet should keep looking exactly like it always did.
const DEFAULT_CALENDAR: CalendarPreference = "jalali";

export function getPreferredCalendar(): CalendarPreference {
  const saved = localStorage.getItem(scopedKey(STORAGE_KEY));

  return saved === "gregorian" ? "gregorian" : DEFAULT_CALENDAR;
}

export function setPreferredCalendar(calendar: CalendarPreference) {
  localStorage.setItem(scopedKey(STORAGE_KEY), calendar);
}

export function resetCalendarPreference() {
  localStorage.removeItem(scopedKey(STORAGE_KEY));
}
