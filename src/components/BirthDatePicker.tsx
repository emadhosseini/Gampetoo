import { useMemo } from "react";

import { WheelColumn } from "@/components/WheelColumn";
import { GREGORIAN_MONTH_NAMES_FA } from "@/utils/dateFormat";

// Nobody using a fitness app is outside this, and a wheel has to have ends.
const MIN_YEAR = 1920;
const OLDEST_PLAUSIBLE_AGE = 12;

export interface BirthDatePickerProps {
  /** Gregorian ISO date, YYYY-MM-DD. */
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
}

function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one — leap years
  // included, without a rule for them anywhere in here.
  return new Date(year, month, 0).getDate();
}

function toIso(year: number, month: number, day: number): string {
  const clampedDay = Math.min(day, daysInMonth(year, month));

  return `${year}-${String(month).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
}

// Three wheels rather than a calendar: picking a birth date means moving
// through decades, which a month-at-a-time calendar grid is the wrong shape
// for. Gregorian (میلادی) throughout — that's what the app stores, and the
// stored value is what the age is computed from.
export default function BirthDatePicker({
  value,
  onChange,
  className = "",
}: BirthDatePickerProps) {
  const [year, month, day] = value.split("-").map(Number);

  const maxYear = new Date().getFullYear() - OLDEST_PLAUSIBLE_AGE;

  const years = useMemo(
    () => Array.from({ length: maxYear - MIN_YEAR + 1 }, (_, i) => maxYear - i),
    [maxYear],
  );

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const dayCount = daysInMonth(year, month);

  const days = useMemo(
    () => Array.from({ length: dayCount }, (_, i) => i + 1),
    [dayCount],
  );

  // The 31st of a 30-day month has to land somewhere: it shows as the 30th
  // and is what gets written, so what the wheel reads is what gets saved.
  const clampedDay = Math.min(day, dayCount);

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
        format={(m) => GREGORIAN_MONTH_NAMES_FA[m - 1]}
        textClass="text-lg"
      />

      {/* Remounted whenever the month's length changes: WheelColumn scrolls
          to its selected value once on mount only, so without this a switch
          from a 31-day month to a 30-day one would leave the wheel parked
          past the end of its own shortened list. */}
      <WheelColumn
        key={`days-${dayCount}`}
        values={days}
        selected={clampedDay}
        onSettle={(next) => onChange(toIso(year, month, next))}
        className="w-16"
      />
    </div>
  );
}
