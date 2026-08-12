import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import { getPreferredCalendar, setPreferredCalendar } from "@/utils/calendarPreferenceEngine";
import {
  getAppSettings,
  saveAppSettings,
  type Language,
  type Theme,
  type WeekStart,
  type WeightUnit,
} from "@/utils/appSettingsEngine";
import type { CalendarPreference } from "@/utils/calendarPreferenceEngine";

// Every row edits local state only while the popup is open — nothing is
// written to storage until "ذخیره" is actually tapped (see handleSave),
// so closing without saving (the X button, or tapping outside) discards
// whatever was changed. Reading the current saved values happens once, on
// open, via the two engines below (appSettingsEngine for
// theme/language/weightUnit/weekStart/restSeconds, calendarPreferenceEngine
// for تقویم — kept separate since calendar predates this Save button and
// already had its own storage).

export interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
}

// A compact two-option pill switch for one settings row — same sliding-
// highlight recipe as PillTabBar, just sized for a row rather than a
// full-width nav bar, and label-only (no icons) since these choices
// (تاریک/روشن, فارسی/English, ...) don't have natural icons.
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  disabled?: boolean;
}) {
  return (
    <div className="glass-chip relative flex items-center rounded-full p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className="relative z-10 flex-1 rounded-full px-3 py-1.5 text-xs font-medium text-white [-webkit-tap-highlight-color:transparent] disabled:pointer-events-none"
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
// settings-style row in this app already uses. `disabled` dims the whole
// row (label included) and blocks its control — used for settings that are
// saved but not wired up to anything yet (see SettingsSidebar below).
function SettingsRow({
  label,
  children,
  disabled,
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 ${disabled ? "opacity-40" : ""}`}
    >
      <span className="text-sm font-medium text-white">{label}</span>
      {children}
    </div>
  );
}

export default function SettingsSidebar({ open, onClose }: SettingsSidebarProps) {
  const [theme, setTheme] = useState<Theme>(() => getAppSettings().theme);
  const [language, setLanguage] = useState<Language>(() => getAppSettings().language);
  const [calendar, setCalendar] = useState<CalendarPreference>(getPreferredCalendar);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => getAppSettings().weightUnit);
  const [weekStart, setWeekStart] = useState<WeekStart>(() => getAppSettings().weekStart);
  const [restSeconds, setRestSeconds] = useState(() => getAppSettings().restSeconds);
  const [saved, setSaved] = useState(false);

  if (!open) {
    return null;
  }

  function handleSave() {
    saveAppSettings({ theme, language, weightUnit, weekStart, restSeconds });
    setPreferredCalendar(calendar);

    setSaved(true);

    // A reload (like WorkoutHeader's "فراموش کردم" flow, the app's
    // existing pattern for a change that has to be reflected everywhere
    // at once) — there's no shared reactive store, so every currently-
    // mounted page's own reads of these settings (تقویم above all —
    // dateFormat.ts's "Display" formatters read it fresh on every call)
    // need a real remount to pick up the new values. The brief delay
    // just lets "ذخیره شد ✅" actually be seen before the page goes away.
    setTimeout(() => window.location.reload(), 400);
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
          {/* تقویم، زمان استراحت و روز شروع هفته گزینه‌های واقعاً فعال‌ان —
              بقیه (تم، زبان، واحد وزن) ذخیره می‌شن ولی هنوز جای دیگه‌ای از
              اپ ازشون استفاده نمی‌کنه، پس غیرفعال و کم‌رنگ نمایش داده
              می‌شن تا گزینه‌ای که کار نمی‌کنه گمراه‌کننده نباشه. */}
          <SettingsRow label="تقویم">
            <SegmentedControl
              layoutId="settings-calendar"
              value={calendar}
              onChange={setCalendar}
              options={[
                { value: "jalali", label: "شمسی" },
                { value: "gregorian", label: "میلادی" },
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

          <SettingsRow label="تم" disabled>
            <SegmentedControl
              layoutId="settings-theme"
              value={theme}
              onChange={setTheme}
              disabled
              options={[
                { value: "dark", label: "تاریک" },
                { value: "light", label: "روشن" },
              ]}
            />
          </SettingsRow>

          <SettingsRow label="زبان" disabled>
            <SegmentedControl
              layoutId="settings-language"
              value={language}
              onChange={setLanguage}
              disabled
              options={[
                { value: "fa", label: "فارسی" },
                { value: "en", label: "English" },
              ]}
            />
          </SettingsRow>

          <SettingsRow label="واحد وزن" disabled>
            <SegmentedControl
              layoutId="settings-weight-unit"
              value={weightUnit}
              onChange={setWeightUnit}
              disabled
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
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="mt-4 w-full glass-action rounded-2xl py-3 font-bold text-white"
        >
          {saved ? "ذخیره شد ✅" : "ذخیره"}
        </button>
      </div>
    </ModalOverlay>
  );
}
