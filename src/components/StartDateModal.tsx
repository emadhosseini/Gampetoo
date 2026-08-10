import { useEffect, useState } from "react";

import DatePickerImport, { DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian";
import gregorianCalendar from "react-date-object/calendars/gregorian";
// react-multi-date-picker ships as CommonJS; depending on the bundler's
// interop the default import can arrive as the module namespace rather
// than the component itself.
const DatePicker =
  (DatePickerImport as unknown as { default?: typeof DatePickerImport })
    .default ?? DatePickerImport;
import persian_fa from "react-date-object/locales/persian_fa";
// Persian script/digits, Gregorian calendar system — keeps month names and
// numerals reading the same as the rest of this Persian-language app while
// actually switching which calendar the picker counts days in.
import gregorian_fa from "react-date-object/locales/gregorian_fa";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import "react-multi-date-picker/styles/colors/green.css";

import ModalOverlay from "@/components/ModalOverlay";
import { getTodayLocalDate } from "@/utils/dateFormat";
import { getPreferredCalendar } from "@/utils/calendarPreferenceEngine";

const today = getTodayLocalDate;

// Same ISO<->local-Date conversion the old setup-page date picker used —
// avoids `new Date(iso)`'s UTC parsing, which lands a day off from the
// intended calendar date in some timezones.
function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);

  return new Date(y, m - 1, d);
}

function dateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

export interface StartDateModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (isoDate: string) => void;
}

// Two steps in one modal (like AiMealEntryModal's input/loading/results):
// a quick امروز/انتخاب تاریخ choice, then the actual Jalali calendar only
// if the second option was picked — ported straight from the old
// first-run setup page's own date picker (see git history on
// SetupProgramPage.tsx before the program-cycle setup was split out of it).
export default function StartDateModal({
  open,
  onClose,
  onPick,
}: StartDateModalProps) {
  const [step, setStep] = useState<"choice" | "calendar">("choice");
  const [calendarDate, setCalendarDate] = useState(today);

  const isGregorian = getPreferredCalendar() === "gregorian";
  const calendar = isGregorian ? gregorianCalendar : persianCalendar;
  const locale = isGregorian ? gregorian_fa : persian_fa;

  useEffect(() => {
    if (open) {
      setStep("choice");
      setCalendarDate(today());
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function handleConfirmDate() {
    onPick(calendarDate);
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        {step === "choice" ? (
          <>
            <h2 className="text-lg font-bold text-white">
              روز شروع برنامه
            </h2>

            <button
              onClick={() => {
                onPick(today());
                onClose();
              }}
              className="w-full glass-action rounded-2xl py-3 font-bold text-white"
            >
              امروز
            </button>

            <button
              onClick={() => setStep("calendar")}
              className="glass-tap selector-pill w-full rounded-2xl py-3 font-bold text-white"
            >
              انتخاب تاریخ
            </button>

            <button
              onClick={onClose}
              className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
            >
              بستن
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-white">
              از چه تاریخی این چرخه آغاز شود؟
            </h2>

            <DatePicker
              value={
                new DateObject({
                  date: isoToLocalDate(calendarDate),
                  calendar,
                  locale,
                })
              }
              onChange={(date) => {
                if (date instanceof DateObject) {
                  setCalendarDate(dateToISO(date.toDate()));
                }
              }}
              calendar={calendar}
              locale={locale}
              calendarPosition="top-center"
              editable={false}
              format="D MMMM YYYY"
              className="bg-dark green"
              containerClassName="w-full"
              inputClass="glass-chip w-full rounded-xl p-4 text-center text-white"
            />

            <button
              onClick={handleConfirmDate}
              className="w-full glass-action rounded-2xl py-3 font-bold text-white"
            >
              تایید
            </button>

            <button
              onClick={() => setStep("choice")}
              className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
            >
              بازگشت
            </button>
          </>
        )}
      </div>
    </ModalOverlay>
  );
}
