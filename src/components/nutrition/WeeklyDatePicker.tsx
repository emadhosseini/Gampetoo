import { useState, type ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";

import { Calendar, DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian";
import gregorianCalendar from "react-date-object/calendars/gregorian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian_fa from "react-date-object/locales/gregorian_fa";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import "react-multi-date-picker/styles/colors/green.css";

import ModalOverlay from "@/components/ModalOverlay";
import { hapticLight, hapticSelection } from "@/native/haptics";
import { isNativeIos } from "@/native/platform";
import { formatDisplayShort, getTodayLocalDate, isoToLocalDate } from "@/utils/dateFormat";
import { getPreferredCalendar } from "@/utils/calendarPreferenceEngine";
import { toFaDigits } from "@/utils/numberFormat";

const today = getTodayLocalDate;

const JALALI_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const GREGORIAN_WEEKDAYS = ["ی", "د", "س", "چ", "پ", "ج", "ش"];

function dateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

/**
 * Authentic Apple iOS 27 Liquid Glass Calendar Grid — replaces the boxy gray
 * third-party calendar popup on native iOS while supporting both Jalali
 * (شمسی) and Gregorian (میلادی) calendars via `DateObject`.
 */
function IosCalendarGrid({
  selectedDate,
  isGregorian,
  onPick,
  onClose,
}: {
  selectedDate: string;
  isGregorian: boolean;
  onPick: (iso: string) => void;
  onClose: () => void;
}) {
  const calendar = isGregorian ? gregorianCalendar : persianCalendar;
  const locale = isGregorian ? gregorian_fa : persian_fa;
  const todayIso = today();

  const [cursor, setCursor] = useState<DateObject>(
    () =>
      new DateObject({
        date: isoToLocalDate(selectedDate),
        calendar,
        locale,
      }).setDay(1),
  );

  const monthFirst = new DateObject(cursor).setDay(1);
  const daysInMonth = monthFirst.month.length;
  // DateObject.weekDay.index is 0-based from the calendar's own first day of
  // week (Saturday=0 for Jalali, Sunday=0 for Gregorian).
  const leadingBlanks = monthFirst.weekDay.index;
  const weekdays = isGregorian ? GREGORIAN_WEEKDAYS : JALALI_WEEKDAYS;

  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new DateObject(monthFirst).setDay(day);
    cells.push({ day, iso: dateToISO(d.toDate()) });
  }

  function shiftMonth(delta: number) {
    hapticLight();
    setCursor((prev) => new DateObject(prev).add(delta, "month").setDay(1));
  }

  function jumpToday() {
    hapticSelection();
    onPick(todayIso);
    onClose();
  }

  return (
    <div className="glass-panel glass-static rounded-[30px] p-5">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" aria-hidden="true" />

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="text-right">
          <h2 className="text-base font-bold text-white">
            {monthFirst.month.name} {toFaDigits(monthFirst.year)}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {selectedDate !== todayIso && (
            <button
              type="button"
              onClick={jumpToday}
              className="glass-chip rounded-full px-3 py-1.5 text-xs font-semibold text-avocado-yellow"
            >
              امروز
            </button>
          )}
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="ماه قبل"
            className="glass-chip flex h-9 w-9 items-center justify-center rounded-full text-white"
          >
            <ChevronRight size={17} />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="ماه بعد"
            className="glass-chip flex h-9 w-9 items-center justify-center rounded-full text-white"
          >
            <ChevronLeft size={17} />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center">
        {weekdays.map((label) => (
          <span key={label} className="py-1 text-[11px] font-semibold text-white/45">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {cells.map((cell, index) => {
          if (!cell) {
            return <span key={`blank-${index}`} className="h-10" />;
          }

          const isSelected = cell.iso === selectedDate;
          const isTodayCell = cell.iso === todayIso;

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => {
                hapticSelection();
                onPick(cell.iso);
                onClose();
              }}
              className={`relative mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-sm transition-transform active:scale-90 [-webkit-tap-highlight-color:transparent] ${
                isSelected
                  ? "bg-avocado-yellow font-bold text-forest-950 shadow-[0_0_18px_rgba(250,234,92,0.35)]"
                  : isTodayCell
                    ? "bg-white/10 font-bold text-avocado-yellow ring-1 ring-avocado-yellow/60"
                    : "font-medium text-white hover:bg-white/8"
              }`}
            >
              <span>{toFaDigits(cell.day)}</span>
              {isTodayCell && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-avocado-yellow" />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="glass-action mt-5 w-full rounded-2xl py-3 text-sm font-semibold text-white"
      >
        بستن
      </button>
    </div>
  );
}

export interface WeeklyDatePickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  trailing?: ReactNode;
}

export default function WeeklyDatePicker({
  selectedDate,
  onSelectDate,
  trailing,
}: WeeklyDatePickerProps) {
  const [open, setOpen] = useState(false);
  const nativeIos = isNativeIos();

  const isGregorian = getPreferredCalendar() === "gregorian";
  const calendar = isGregorian ? gregorianCalendar : persianCalendar;
  const locale = isGregorian ? gregorian_fa : persian_fa;
  const isToday = selectedDate === today();

  return (
    <>
      <div className="space-y-2 px-5 pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setOpen(true);
            }}
            className={`glass-chip glass-static flex min-w-0 flex-1 items-center justify-center gap-2 py-2 text-xs font-medium text-white ${
              nativeIos ? "rounded-full" : "rounded-xl"
            }`}
          >
            <CalendarDays size={14} className={nativeIos ? "text-avocado-yellow/80" : "text-white/60"} />
            {isToday ? "امروز" : formatDisplayShort(isoToLocalDate(selectedDate))}
          </button>

          {trailing}
        </div>

        {!isToday && (
          <button
            type="button"
            onClick={() => {
              hapticSelection();
              onSelectDate(today());
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-avocado-yellow/15 py-2 text-xs font-medium text-avocado-yellow"
          >
            <TriangleAlert size={14} />
            داری روز دیگه‌ای رو می‌بینی — برای برگشت به امروز بزن
          </button>
        )}
      </div>

      {open && (
        <ModalOverlay onClose={() => setOpen(false)}>
          {nativeIos ? (
            <IosCalendarGrid
              selectedDate={selectedDate}
              isGregorian={isGregorian}
              onPick={onSelectDate}
              onClose={() => setOpen(false)}
            />
          ) : (
            <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
              <h2 className="text-lg font-bold text-white">انتخاب تاریخ</h2>

              <Calendar
                value={
                  new DateObject({
                    date: isoToLocalDate(selectedDate),
                    calendar,
                    locale,
                  })
                }
                onChange={(date: unknown) => {
                  if (date instanceof DateObject) {
                    onSelectDate(dateToISO(date.toDate()));
                    setOpen(false);
                  }
                }}
                calendar={calendar}
                locale={locale}
                className="bg-dark green mx-auto"
              />

              {!isToday && (
                <button
                  onClick={() => {
                    onSelectDate(today());
                    setOpen(false);
                  }}
                  className="w-full glass-action rounded-2xl py-3 font-bold text-white"
                >
                  برگشت به امروز
                </button>
              )}

              <button
                onClick={() => setOpen(false)}
                className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
              >
                بستن
              </button>
            </div>
          )}
        </ModalOverlay>
      )}
    </>
  );
}
