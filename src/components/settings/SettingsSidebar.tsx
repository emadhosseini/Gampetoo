import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import Toggle from "@/components/Toggle";
import { hapticSelection } from "@/native/haptics";
import {
  enableHealthKit,
  getCachedHealthSummary,
  isHealthKitEnabled,
  setHealthKitEnabled,
  syncHealthKitFromAppleHealth,
  type CachedHealthSummary,
} from "@/native/healthkit";
import { isNativeApp } from "@/native/platform";
import { getWatchStatus, syncWatchContext } from "@/native/watchBridge";
import type { WatchStatus } from "@/native/nativePlugin";
import { syncNow } from "@/sync/remoteSync";
import { toFaDigits } from "@/utils/numberFormat";
import {
  getNotificationPrefs,
  getSavedApnsToken,
  registerForPushNotifications,
  saveNotificationPrefs,
  sendTestPushNotification,
  syncDailyReminders,
  type NotificationPrefs,
} from "@/native/notifications";
import {
  getCalorieTrackingMode,
  setCalorieTrackingMode,
  type CalorieTrackingMode,
} from "@/utils/calorieModeEngine";
import { hasTodaysLoggedEntries, resetTodaysLog } from "@/utils/dailyLogEngine";
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

// Every row's control gets this exact width and height, whatever it is —
// a two-option pill, a number field, or a value button. Before this each
// sized itself to its own content, so "شمسی/میلادی" and the rest-seconds
// box ended up visibly different widths in the same column.
const CONTROL = "h-9 w-40 shrink-0";

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
    <div className={`glass-chip relative flex items-center rounded-full p-1 ${CONTROL}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => {
            hapticSelection();
            onChange(option.value);
          }}
          className="relative z-10 h-full flex-1 rounded-full text-xs font-medium text-white [-webkit-tap-highlight-color:transparent] disabled:pointer-events-none"
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
  const [calorieMode, setCalorieMode] = useState<CalorieTrackingMode>(
    () => getCalorieTrackingMode() ?? "perMeal",
  );
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(getNotificationPrefs);
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);
  const [testingPush, setTestingPush] = useState(false);
  const [healthEnabled, setHealthEnabled] = useState<boolean>(isHealthKitEnabled);
  const [healthSummary, setHealthSummary] = useState<CachedHealthSummary | null>(
    getCachedHealthSummary,
  );
  const [syncingHealth, setSyncingHealth] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [watchStatus, setWatchStatus] = useState<WatchStatus | null>(null);
  const [saved, setSaved] = useState(false);
  const nativeApp = isNativeApp();
  const hasPushToken = nativeApp && getSavedApnsToken() !== null;

  useEffect(() => {
    if (!open || !nativeApp) return;
    void getWatchStatus().then(setWatchStatus);
  }, [open, nativeApp]);

  if (!open) {
    return null;
  }

  function formatTimeValue(hour: number, minute: number): string {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  async function handleSave() {
    // Switching how calories are tracked invalidates today's food log —
    // the two modes store it in incompatible shapes — so it's the one
    // setting here that has to ask before it can be saved, and that
    // question belongs on the save, not on the tap that moved the pill.
    // Answering "no" abandons the whole save rather than quietly keeping
    // the old mode while writing everything else.
    const savedMode = getCalorieTrackingMode();
    const modeChanged = savedMode !== null && savedMode !== calorieMode;

    if (modeChanged && hasTodaysLoggedEntries()) {
      const confirmed = window.confirm(
        "با تغییر روش ثبت کالری، غذاهایی که امروز ثبت کردی پاک می‌شن و قابل بازگردانی نیستن.\n\nادامه می‌دی؟",
      );

      if (!confirmed) return;

      resetTodaysLog();
    }

    setCalorieTrackingMode(calorieMode);
    // Spread over what's stored rather than writing a fresh object: this
    // screen doesn't own every setting in the blob (the meal-display ones
    // are set from the daily-log page), and listing only its own fields
    // would silently clear the rest on every save.
    saveAppSettings({
      ...getAppSettings(),
      theme,
      language,
      weightUnit,
      weekStart,
      restSeconds,
    });
    setPreferredCalendar(calendar);

    if (nativeApp) {
      saveNotificationPrefs(notifPrefs);
      const { granted } = await syncDailyReminders(notifPrefs);
      if (
        !granted &&
        (notifPrefs.workoutReminderEnabled || notifPrefs.waterRemindersEnabled)
      ) {
        setNotifFeedback("اجازه اعلان در تنظیمات آیفون فعال نیست.");
      } else if (notifPrefs.pushEnabled) {
        const pushRes = await registerForPushNotifications();
        if (!pushRes.ok && pushRes.error) {
          setNotifFeedback(pushRes.error);
        }
      }
    }

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
      <div className="glass-panel glass-static max-h-[85vh] overflow-y-auto rounded-[30px] p-6">
        {nativeApp && (
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" aria-hidden="true" />
        )}
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
          {/* Working settings first, then the ones that are saved but not
              wired up to anything yet (تم، زبان، واحد وزن) — those sit at
              the bottom, dimmed, so the list reads top-down as "things that
              do something" before "things that don't yet". */}
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

          <SettingsRow label="روش ثبت کالری">
            <SegmentedControl
              layoutId="settings-calorie-mode"
              value={calorieMode}
              onChange={setCalorieMode}
              options={[
                { value: "perMeal", label: "وعده‌ای" },
                { value: "daily", label: "روزانه" },
              ]}
            />
          </SettingsRow>

          <SettingsRow label="زمان استراحت پیش‌فرض">
            <div
              className={`glass-chip glass-static flex items-center justify-center gap-1.5 rounded-full ${CONTROL}`}
            >
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={restSeconds}
                onChange={(e) => setRestSeconds(Number(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                className="w-12 bg-transparent text-center text-sm text-white outline-none"
              />
              <span className="text-xs text-white/50">ثانیه</span>
            </div>
          </SettingsRow>

          {nativeApp && (
            <>
              <SettingsRow label="اعلان اتمام استراحت">
                <Toggle
                  checked={notifPrefs.restTimerAlert}
                  onChange={() =>
                    setNotifPrefs((prev) => ({
                      ...prev,
                      restTimerAlert: !prev.restTimerAlert,
                    }))
                  }
                />
              </SettingsRow>

              <SettingsRow label="یادآور تمرین روزانه">
                <div className="flex items-center gap-2">
                  {notifPrefs.workoutReminderEnabled && (
                    <input
                      type="time"
                      dir="ltr"
                      value={formatTimeValue(
                        notifPrefs.workoutReminderHour,
                        notifPrefs.workoutReminderMinute,
                      )}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(":").map(Number);
                        if (Number.isFinite(h) && Number.isFinite(m)) {
                          setNotifPrefs((prev) => ({
                            ...prev,
                            workoutReminderHour: h,
                            workoutReminderMinute: m,
                          }));
                        }
                      }}
                      className="glass-chip glass-static h-8 rounded-full px-2.5 text-xs text-white outline-none"
                    />
                  )}
                  <Toggle
                    checked={notifPrefs.workoutReminderEnabled}
                    onChange={() =>
                      setNotifPrefs((prev) => ({
                        ...prev,
                        workoutReminderEnabled: !prev.workoutReminderEnabled,
                      }))
                    }
                  />
                </div>
              </SettingsRow>

              <SettingsRow label="یادآور نوشیدن آب">
                <Toggle
                  checked={notifPrefs.waterRemindersEnabled}
                  onChange={() =>
                    setNotifPrefs((prev) => ({
                      ...prev,
                      waterRemindersEnabled: !prev.waterRemindersEnabled,
                    }))
                  }
                />
              </SettingsRow>

              <SettingsRow label="اعلان‌های سرور (Push)">
                <div className="flex items-center gap-2">
                  {notifPrefs.pushEnabled && hasPushToken && (
                    <button
                      type="button"
                      disabled={testingPush}
                      onClick={async () => {
                        setTestingPush(true);
                        setNotifFeedback(null);
                        const res = await sendTestPushNotification();
                        setNotifFeedback(res.message);
                        setTestingPush(false);
                      }}
                      className="glass-chip rounded-full px-3 py-1.5 text-xs font-medium text-avocado-yellow disabled:opacity-50"
                    >
                      {testingPush ? "در حال ارسال..." : "تست پوش"}
                    </button>
                  )}
                  <Toggle
                    checked={notifPrefs.pushEnabled}
                    onChange={() =>
                      setNotifPrefs((prev) => ({
                        ...prev,
                        pushEnabled: !prev.pushEnabled,
                      }))
                    }
                  />
                </div>
              </SettingsRow>

              <SettingsRow label="همگام‌سازی Apple Health">
                <div className="flex items-center gap-2">
                  {healthEnabled && (
                    <button
                      type="button"
                      disabled={syncingHealth}
                      onClick={async () => {
                        setSyncingHealth(true);
                        setNotifFeedback(null);
                        const next = await syncHealthKitFromAppleHealth();
                        if (next) {
                          setHealthSummary(next);
                          setNotifFeedback(
                            `همگام شد: ${toFaDigits(next.steps)} قدم · ${toFaDigits(next.activeCalories)} کالری فعال`,
                          );
                        } else {
                          setNotifFeedback("داده‌ای از Apple Health دریافت نشد.");
                        }
                        setSyncingHealth(false);
                      }}
                      className="glass-chip rounded-full px-3 py-1.5 text-xs font-medium text-avocado-lime disabled:opacity-50"
                    >
                      {syncingHealth ? "در حال دریافت..." : "بروزرسانی"}
                    </button>
                  )}
                  <Toggle
                    checked={healthEnabled}
                    onChange={async () => {
                      if (!healthEnabled) {
                        setSyncingHealth(true);
                        const res = await enableHealthKit();
                        setHealthEnabled(res.ok);
                        if (res.summary) setHealthSummary(res.summary);
                        if (!res.ok && res.error) {
                          setNotifFeedback(res.error);
                        } else if (res.ok) {
                          setNotifFeedback("Apple Health متصل شد ✅");
                        }
                        setSyncingHealth(false);
                      } else {
                        setHealthKitEnabled(false);
                        setHealthEnabled(false);
                      }
                    }}
                  />
                </div>
              </SettingsRow>

              {healthEnabled && healthSummary && (
                <div className="flex items-center justify-between py-2 text-xs text-white/60">
                  <span>امروز در Apple Health</span>
                  <span>
                    {toFaDigits(healthSummary.steps)} قدم · {toFaDigits(healthSummary.activeCalories)}{" "}
                    کالری
                  </span>
                </div>
              )}

              <SettingsRow label="اتصال Apple Watch">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">
                    {watchStatus?.watchAppInstalled
                      ? watchStatus.reachable
                        ? "متصل ✓"
                        : "جفت‌شده"
                      : watchStatus?.paired
                        ? "نصب نشده"
                        : "جفت نشده"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      syncWatchContext();
                      setNotifFeedback("اطلاعات امروز به اپل واچ ارسال شد ⌚");
                    }}
                    className="glass-chip rounded-full px-3 py-1.5 text-xs font-medium text-white"
                  >
                    ارسال
                  </button>
                </div>
              </SettingsRow>

              <SettingsRow label="همگام‌سازی ابری">
                <button
                  type="button"
                  disabled={syncingCloud}
                  onClick={async () => {
                    setSyncingCloud(true);
                    setNotifFeedback(null);
                    const res = await syncNow(true);
                    if (!res.ok) {
                      setNotifFeedback("اتصال به سرور برقرار نشد.");
                    } else if (!res.changed) {
                      setNotifFeedback("اطلاعات کاملاً به‌روز است ✅");
                    }
                    setSyncingCloud(false);
                  }}
                  className="glass-chip rounded-full px-3.5 py-1.5 text-xs font-medium text-avocado-yellow disabled:opacity-50"
                >
                  {syncingCloud ? "در حال همگام‌سازی..." : "همگام‌سازی الان"}
                </button>
              </SettingsRow>
            </>
          )}

          {notifFeedback && (
            <p className="py-2 text-center text-xs text-avocado-yellow">{notifFeedback}</p>
          )}

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
