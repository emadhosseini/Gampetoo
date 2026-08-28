import { useState, type ReactNode } from "react";
import { CalendarDays, TriangleAlert } from "lucide-react";

import { Calendar, DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian";
import gregorianCalendar from "react-date-object/calendars/gregorian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian_fa from "react-date-object/locales/gregorian_fa";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import "react-multi-date-picker/styles/colors/green.css";

import ModalOverlay from "@/components/ModalOverlay";
import { formatDisplayShort, getTodayLocalDate, isoToLocalDate } from "@/utils/dateFormat";
import { getPreferredCalendar } from "@/utils/calendarPreferenceEngine";

const today = getTodayLocalDate;

function dateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

export interface WeeklyDatePickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  // Buttons to sit on the same row as the date, taking the width it
  // doesn't — the daily log's meal-display pencil. Same arrangement the
  // workout page's header uses for its own actions, so the two pages read
  // the same way.
  trailing?: ReactNode;
}

/**
 * A compact "which day am I looking at" button above DailyLogPage's meal
 * tab — tapping it opens a real calendar grid (react-multi-date-picker's
 * Calendar, the same component StartDateModal already uses for the
 * program's start date) instead of permanently occupying a strip of
 * screen space with a horizontal date strip. Picking a day in the popup
 * closes it and hands the ISO date straight to the parent, which re-reads
 * every meal/total for that date — see DailyLogPage.
 */
export default function WeeklyDatePicker({
  selectedDate,
  onSelectDate,
  trailing,
}: WeeklyDatePickerProps) {
  const [open, setOpen] = useState(false);

  const isGregorian = getPreferredCalendar() === "gregorian";
  const calendar = isGregorian ? gregorianCalendar : persianCalendar;
  const locale = isGregorian ? gregorian_fa : persian_fa;
  const isToday = selectedDate === today();

  return (
    <>
      <div className="space-y-2 px-5 pt-4">
        {/* One row: the date fills whatever the fixed-size actions beside
            it leave. py-2/text-xs rather than py-2.5/text-sm — this is a
            label you glance at, and at full size it was the loudest thing
            on a page that's really about the meals below it. */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="glass-chip glass-static flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-white"
          >
            <CalendarDays size={14} className="text-white/60" />
            {isToday ? "امروز" : formatDisplayShort(isoToLocalDate(selectedDate))}
          </button>

          {trailing}
        </div>

        {/* Stays on screen (not just inside the calendar popup) for as long
            as a non-today date is selected — a reminder that everything
            below is being logged/edited against that day, not right now,
            so it isn't forgotten mid-session and mistaken for today's
            numbers. Tapping it jumps straight back without reopening the
            calendar. */}
        {!isToday && (
          <button
            type="button"
            onClick={() => onSelectDate(today())}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-avocado-yellow/15 py-2 text-xs font-medium text-avocado-yellow"
          >
            <TriangleAlert size={14} />
            داری روز دیگه‌ای رو می‌بینی — برای برگشت به امروز بزن
          </button>
        )}
      </div>

      {open && (
        <ModalOverlay onClose={() => setOpen(false)}>
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
        </ModalOverlay>
      )}
    </>
  );
}
