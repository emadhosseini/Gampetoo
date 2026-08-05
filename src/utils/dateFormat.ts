import DateObject from "react-date-object";
import persianCalendar from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

// startDate (and every other program-cycle date) is stored as a Gregorian
// ISO string (YYYY-MM-DD) — parsed with the year/month/day constructor
// rather than `new Date(iso)` to avoid that overload's UTC parsing, which
// is one day off from the intended local calendar date in some timezones.
function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);

  return new Date(y, m - 1, d);
}

/** e.g. "۱۴ مرداد ۱۴۰۵" — Jalali calendar, Persian digits/script. */
export function formatJalaliFull(iso: string): string {
  return new DateObject({
    date: isoToLocalDate(iso),
    calendar: persianCalendar,
    locale: persian_fa,
  }).format("D MMMM YYYY");
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

/** e.g. "۲۲" — just the day-of-month, Persian digits, for dense chart x-axes. */
export function formatDayNumber(date: Date): string {
  return date.getDate().toLocaleString("fa-IR");
}

/** e.g. "۸" for August — the Gregorian month's 1-12 number, Persian digits. */
export function formatMonthNumber(date: Date): string {
  return (date.getMonth() + 1).toLocaleString("fa-IR");
}
