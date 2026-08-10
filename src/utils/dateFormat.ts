import DateObject from "react-date-object";
import persianCalendar from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { getPreferredCalendar } from "./calendarPreferenceEngine";

// startDate (and every other program-cycle date) is stored as a Gregorian
// ISO string (YYYY-MM-DD) — parsed with the year/month/day constructor
// rather than `new Date(iso)` to avoid that overload's UTC parsing, which
// is one day off from the intended local calendar date in some timezones.
export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);

  return new Date(y, m - 1, d);
}

/**
 * Today's date as a local YYYY-MM-DD — every daily engine's own idea of
 * "today" (session completion, the daily food log, water, weight-for-today,
 * activity) is built on this, and it has to be. `new Date().toISOString()`
 * reports UTC, so `.split("T")[0]` rolls the day over at UTC midnight —
 * 03:30 local in Iran (UTC+3:30) — not local midnight. The workout
 * program's own day math (programEngine.ts) already used local Date
 * getters and switched at real midnight; every daily-data engine used the
 * UTC-based version instead, which is why the program looked like it
 * changed at midnight while yesterday's completed/eaten/logged state hung
 * around for three and a half more hours.
 */
export function getTodayLocalDate(): string {
  const now = new Date();

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

/** Same local (not UTC) date-key logic as getTodayLocalDate, for an
 * arbitrary Date rather than always "now" — used for bucketing historical
 * entries by calendar day (see statBuckets.ts). */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

/** e.g. "۱۴ مرداد ۱۴۰۵" — Jalali calendar, Persian digits/script. */
export function formatJalaliFull(iso: string): string {
  return new DateObject({
    date: isoToLocalDate(iso),
    calendar: persianCalendar,
    locale: persian_fa,
  }).format("D MMMM YYYY");
}

/** e.g. "۱۴ مرداد" — Jalali, no year — for a recent-history row where the
 * year is implied. */
export function formatJalaliShort(iso: string): string {
  return new DateObject({
    date: isoToLocalDate(iso),
    calendar: persianCalendar,
    locale: persian_fa,
  }).format("D MMMM");
}

export const GREGORIAN_MONTH_NAMES_FA = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "می",
  "ژوئن",
  "جولای",
  "آگوست",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
];

/** e.g. "۲۲ جولای" — Persian digits/script, Gregorian calendar. */
export function formatGregorianShort(date: Date): string {
  const day = date.getDate().toLocaleString("fa-IR");
  const month = GREGORIAN_MONTH_NAMES_FA[date.getMonth()];

  return `${day} ${month}`;
}

/**
 * e.g. "۱۲ مارس ۱۹۹۵" — the short form plus the year, for dates where the
 * year is the point (a birth date) rather than noise (a chart axis).
 */
export function formatGregorianFull(iso: string): string {
  const date = isoToLocalDate(iso);

  return `${formatGregorianShort(date)} ${date.getFullYear().toLocaleString("fa-IR", { useGrouping: false })}`;
}

/**
 * e.g. "آگوست ۲۰۲۵" — month and year, no day-of-month. For a range spelled
 * out in whole months (the 6-month/year chart windows), a day number would
 * be noise: those windows start on the 1st of their oldest month by
 * definition, not on whatever day it happens to be today.
 */
export function formatGregorianMonthYear(date: Date): string {
  const month = GREGORIAN_MONTH_NAMES_FA[date.getMonth()];
  const year = date.getFullYear().toLocaleString("fa-IR", { useGrouping: false });

  return `${month} ${year}`;
}

/** e.g. "۲۲" — just the day-of-month, Persian digits, for dense chart x-axes. */
export function formatDayNumber(date: Date): string {
  return date.getDate().toLocaleString("fa-IR");
}

/** e.g. "۸" for August — the Gregorian month's 1-12 number, Persian digits. */
export function formatMonthNumber(date: Date): string {
  return (date.getMonth() + 1).toLocaleString("fa-IR");
}

/** e.g. "۲۲" — just the Jalali day-of-month, Persian digits. Jalali
 * equivalent of formatDayNumber, for the same dense chart x-axes once the
 * user's calendar preference is Jalali. */
export function formatJalaliDayNumber(date: Date): string {
  return new DateObject({ date, calendar: persianCalendar, locale: persian_fa }).format("D");
}

/** e.g. "۵" for مرداد — the Jalali month's 1-12 number, Persian digits.
 * Jalali equivalent of formatMonthNumber. */
export function formatJalaliMonthNumber(date: Date): string {
  return new DateObject({ date, calendar: persianCalendar, locale: persian_fa }).format("M");
}

/** e.g. "مرداد ۱۴۰۵" — Jalali month and year, no day-of-month. Jalali
 * equivalent of formatGregorianMonthYear, for the same 6-month/year chart
 * windows. */
export function formatJalaliMonthYear(date: Date): string {
  return new DateObject({ date, calendar: persianCalendar, locale: persian_fa }).format(
    "MMMM YYYY",
  );
}

// Sunday-first, matching Date.getDay()'s own 0=Sunday indexing — used only
// by formatTodayFull's Gregorian branch below, since a Jalali weekday name
// comes straight from DateObject's own "dddd" token instead.
const PERSIAN_WEEKDAYS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

/**
 * e.g. "چهارشنبه، ۵ آگوست ۱۴۰۵" (Jalali) or "Wednesday، ۵ August ۲۰۲۶"
 * spelled out in Persian script either way — today's weekday plus its
 * full date, in whichever calendar the user has picked (see
 * calendarPreferenceEngine). Used for the home page's hero-card date
 * line — the one place in the app that always means "today", so this
 * reads the preference directly rather than needing an iso/Date param
 * like the Display wrappers below.
 */
export function formatTodayFull(): string {
  const now = new Date();

  if (getPreferredCalendar() === "gregorian") {
    const weekday = PERSIAN_WEEKDAYS[now.getDay()];

    return `${weekday}، ${formatGregorianFull(toLocalDateString(now))}`;
  }

  const jalali = new DateObject({
    date: now,
    calendar: persianCalendar,
    locale: persian_fa,
  });

  return jalali.format("dddd، D MMMM YYYY");
}

// ---------------------------------------------------------------------
// Calendar-aware "Display" wrappers — the ones actual UI call sites
// should reach for whenever a date is shown to the user (a logged
// entry's date, a chart's date-range/axis labels, a program's start
// date, ...). Each just routes to the matching Jalali/Gregorian
// primitive above based on getPreferredCalendar(); nothing here computes
// a date value, only which of two already-correct renderings to return.
// ---------------------------------------------------------------------

/** Full date (day + month + year) in the user's preferred calendar —
 * e.g. "۱۴ مرداد ۱۴۰۵" or "۵ آگوست ۲۰۲۶". */
export function formatDisplayFull(iso: string): string {
  return getPreferredCalendar() === "gregorian" ? formatGregorianFull(iso) : formatJalaliFull(iso);
}

/** Short date (day + month, no year) in the user's preferred calendar —
 * e.g. "۱۴ مرداد" or "۵ آگوست". */
export function formatDisplayShort(date: Date): string {
  return getPreferredCalendar() === "gregorian"
    ? formatGregorianShort(date)
    : formatJalaliShort(toLocalDateString(date));
}

/** Bare day-of-month in the user's preferred calendar, for dense chart
 * x-axes. */
export function formatDisplayDayNumber(date: Date): string {
  return getPreferredCalendar() === "gregorian" ? formatDayNumber(date) : formatJalaliDayNumber(date);
}

/** Bare 1-12 month number in the user's preferred calendar. */
export function formatDisplayMonthNumber(date: Date): string {
  return getPreferredCalendar() === "gregorian"
    ? formatMonthNumber(date)
    : formatJalaliMonthNumber(date);
}

/** Month + year, no day — for the 6-month/year chart windows. */
export function formatDisplayMonthYear(date: Date): string {
  return getPreferredCalendar() === "gregorian"
    ? formatGregorianMonthYear(date)
    : formatJalaliMonthYear(date);
}
