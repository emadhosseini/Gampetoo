import { useMemo } from "react";
import DateObject from "react-date-object";
import persianCalendar from "react-date-object/calendars/persian";
import gregorianCalendar from "react-date-object/calendars/gregorian";
import persian_fa from "react-date-object/locales/persian_fa";

import { WheelColumn } from "@/components/WheelColumn";
import { GREGORIAN_MONTH_NAMES_FA, isoToLocalDate, toLocalDateString } from "@/utils/dateFormat";
import { getPreferredCalendar } from "@/utils/calendarPreferenceEngine";

// Nobody using a fitness app is outside this, and a wheel has to have ends.
const MIN_YEAR = 1920;
const OLDEST_PLAUSIBLE_AGE = 12;

const JALALI_MONTH_NAMES_FA = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export interface BirthDatePickerProps {
  /** Always a Gregorian ISO date, YYYY-MM-DD — what userEngine actually
   * stores and computes age from, regardless of which calendar the wheels
   * below are currently showing. */
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
}

function daysInGregorianMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one — leap years
  // included, without a rule for them anywhere in here.
  return new Date(year, month, 0).getDate();
}

function toGregorianIso(year: number, month: number, day: number): string {
  const clampedDay = Math.min(day, daysInGregorianMonth(year, month));

  return `${year}-${String(month).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
}

// react-date-object's own month.length already accounts for Jalali's leap
// years (اسفند is 29 or 30 days depending on the year) — no manual leap
// rule needed here, unlike the Gregorian helper above.
function daysInJalaliMonth(year: number, month: number): number {
  return new DateObject({ year, month, day: 1, calendar: persianCalendar, locale: persian_fa })
    .month.length;
}

function jalaliToGregorianIso(year: number, month: number, day: number): string {
  const clampedDay = Math.min(day, daysInJalaliMonth(year, month));

  const gregorian = new DateObject({
    year,
    month,
    day: clampedDay,
    calendar: persianCalendar,
    locale: persian_fa,
  }).convert(gregorianCalendar);

  return toLocalDateString(gregorian.toDate());
}

function gregorianIsoToJalali(iso: string): { year: number; month: number; day: number } {
  const jalali = new DateObject({ date: isoToLocalDate(iso), calendar: gregorianCalendar }).convert(
    persianCalendar,
  );

  return { year: jalali.year, month: jalali.month.number, day: jalali.day };
}

// Three wheels rather than a calendar: picking a birth date means moving
// through decades, which a month-at-a-time calendar grid is the wrong shape
// for. Follows the app's calendar preference (شمسی/میلادی, same setting
// dateFormat.ts's "Display" formatters read) — the wheels show whichever
// calendar the user picked, but always convert back to the Gregorian ISO
// `value`/`onChange` contract, since that's what's actually stored and what
// ageFromBirthDate computes from.
export default function BirthDatePicker({
  value,
  onChange,
  className = "",
}: BirthDatePickerProps) {
  const isJalali = getPreferredCalendar() === "jalali";

  const [gYear, gMonth, gDay] = value.split("-").map(Number);
  const jalali = useMemo(() => gregorianIsoToJalali(value), [value]);

  const year = isJalali ? jalali.year : gYear;
  const month = isJalali ? jalali.month : gMonth;
  const day = isJalali ? jalali.day : gDay;

  // Bounds are computed by actually converting the Gregorian boundary
  // dates (rather than hardcoding a Jalali offset ourselves) so the wheel's
  // ends land on the same real ages in either calendar.
  const maxYear = isJalali
    ? gregorianIsoToJalali(toLocalDateString(new Date())).year - OLDEST_PLAUSIBLE_AGE
    : new Date().getFullYear() - OLDEST_PLAUSIBLE_AGE;

  const minYear = isJalali
    ? gregorianIsoToJalali(`${MIN_YEAR}-01-01`).year
    : MIN_YEAR;

  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i),
    [maxYear, minYear],
  );

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const dayCount = isJalali ? daysInJalaliMonth(year, month) : daysInGregorianMonth(year, month);

  const days = useMemo(
    () => Array.from({ length: dayCount }, (_, i) => i + 1),
    [dayCount],
  );

  // The 31st of a 30-day month has to land somewhere: it shows as the
  // month's last day and is what gets written, so what the wheel reads is
  // what gets saved.
  const clampedDay = Math.min(day, dayCount);

  const monthNames = isJalali ? JALALI_MONTH_NAMES_FA : GREGORIAN_MONTH_NAMES_FA;
  const toIso = isJalali ? jalaliToGregorianIso : toGregorianIso;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <WheelColumn
        values={years}
        selected={year}
        onSettle={(next) => onChange(toIso(next, month, day))}
        className="w-20"
        format={(y) => y.toLocaleString("fa-IR", { useGrouping: false })}
      />

      <WheelColumn
        values={months}
        selected={month}
        onSettle={(next) => onChange(toIso(year, next, day))}
        className="w-32"
        format={(m) => monthNames[m - 1]}
        textClass="text-lg"
      />

      {/* Remounted whenever the month's length changes: WheelColumn scrolls
          to its selected value once on mount only, so without this a switch
          from a 31-day month to a 30-day one would leave the wheel parked
          past the end of its own shortened list. Calendar switches remount
          it too (isJalali is part of the key), since Jalali/Gregorian day
          counts for "the same" month number don't match. */}
      <WheelColumn
        key={`days-${isJalali ? "j" : "g"}-${dayCount}`}
        values={days}
        selected={clampedDay}
        onSettle={(next) => onChange(toIso(year, month, next))}
        className="w-16"
      />
    </div>
  );
}
