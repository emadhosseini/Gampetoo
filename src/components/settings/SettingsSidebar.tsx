import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  getPreferredCalendar,
  setPreferredCalendar,
  type CalendarPreference,
} from "@/utils/calendarPreferenceEngine";

// Every row except "تقویم" is still UI-only, per the original ask — local
// state driving the control on screen, nothing read from or written to a
// real engine. تقویم is the one exception: it's wired to
// calendarPreferenceEngine for real, since the whole point of that
// setting is that every date display across the app (home page, workout
// set history, progress charts, ...) actually switches with it — see
// dateFormat.ts's calendar-aware "Display" formatters.

export interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
}

type Theme = "dark" | "light";
type Language = "fa" | "en";
type WeightUnit = "kg" | "lb";
type WeekStart = "saturday" | "monday";

// A compact two-option pill switch for one settings row — same sliding-
// highlight recipe as PillTabBar, just sized for a row rather than a
// full-width nav bar, and label-only (no icons) since these choices
// (تاریک/روشن, فارسی/English, ...) don't have natural icons.
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
}) {
  return (
    <div className="glass-chip relative flex items-center rounded-full p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className="relative z-10 flex-1 rounded-full px-3 py-1.5 text-xs font-medium text-white [-webkit-tap-highlight-color:transparent]"
        >
          {value === option.value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 -z-10 rounded-full bg-white/15"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}

// One labeled row inside the popup — label on the right (RTL reading
// start), its control on the left, same layout convention every other
// settings-style row in this app already uses.
function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm font-medium text-white">{label}</span>
      {children}
    </div>
  );
}

export default function SettingsSidebar({ open, onClose }: SettingsSidebarProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [language, setLanguage] = useState<Language>("fa");
  const [calendar, setCalendar] = useState<CalendarPreference>(getPreferredCalendar);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [weekStart, setWeekStart] = useState<WeekStart>("saturday");
  const [restSeconds, setRestSeconds] = useState(90);

  if (!open) {
    return null;
  }

  // Reloads (like WorkoutHeader's "فراموش کردم" flow, the app's existing
  // pattern for a change that has to be reflected everywhere at once) —
  // there's no shared reactive store, so every currently-mounted page's
  // own date-formatting calls need a fresh read of the new preference,
  // not just this popup's.
  function handleCalendarChange(next: CalendarPreference) {
    setCalendar(next);
    setPreferredCalendar(next);
    window.location.reload();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] overflow-y-auto rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">تنظیمات</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="glass-chip glass-static flex h-9 w-9 items-center justify-center rounded-full text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-2 divide-y divide-white/10">
          <SettingsRow label="تم">
            <SegmentedControl
              layoutId="settings-theme"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "dark", label: "تاریک" },
                { value: "light", label: "روشن" },
              ]}
            />
          </SettingsRow>

          <SettingsRow label="زبان">
            <SegmentedControl
              layoutId="settings-language"
              value={language}
              onChange={setLanguage}
              options={[
                { value: "fa", label: "فارسی" },
                { value: "en", label: "English" },
              ]}
            />
          </SettingsRow>

          <SettingsRow label="تقویم">
            <SegmentedControl
              layoutId="settings-calendar"
              value={calendar}
              onChange={handleCalendarChange}
              options={[
                { value: "jalali", label: "شمسی" },
                { value: "gregorian", label: "میلادی" },
              ]}
            />
          </SettingsRow>

          <SettingsRow label="واحد وزن">
            <SegmentedControl
              layoutId="settings-weight-unit"
              value={weightUnit}
              onChange={setWeightUnit}
              options={[
                { value: "kg", label: "کیلوگرم" },
                { value: "lb", label: "پوند" },
              ]}
            />
          </SettingsRow>

          <SettingsRow label="روز شروع هفته">
            <SegmentedControl
              layoutId="settings-week-start"
              value={weekStart}
              onChange={setWeekStart}
              options={[
                { value: "saturday", label: "شنبه" },
                { value: "monday", label: "دوشنبه" },
              ]}
            />
          </SettingsRow>

          <SettingsRow label="زمان استراحت پیش‌فرض">
            <div className="glass-chip flex items-center gap-1.5 rounded-xl px-3 py-1.5">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={restSeconds}
                onChange={(e) => setRestSeconds(Number(e.target.value) || 0)}
                className="w-12 bg-transparent text-center text-sm text-white outline-none"
              />
              <span className="text-xs text-white/50">ثانیه</span>
            </div>
          </SettingsRow>
        </div>
      </div>
    </ModalOverlay>
  );
}
