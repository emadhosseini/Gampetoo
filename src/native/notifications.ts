import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications, type Token } from "@capacitor/push-notifications";

import { supabase } from "@/lib/supabaseClient";

import { GampetooNative } from "./nativePlugin";
import { isNativeApp, isNativeIos } from "./platform";

const PREFS_KEY = "gampetoo-ios-notification-prefs";
const PUSH_TOKEN_KEY = "gampetoo-ios-apns-token";

const REST_TIMER_NOTIFICATION_ID = 1001;
const WORKOUT_REMINDER_ID = 2001;
const WATER_REMINDER_SCHEDULE = [
  { id: 3001, hour: 10, minute: 0, body: "وقت یه لیوان آب خنکه 💧" },
  { id: 3002, hour: 13, minute: 0, body: "یادت نره آب بنوشی و توی گامپتو ثبتش کنی 💧" },
  { id: 3003, hour: 16, minute: 0, body: "یه لیوان آب برای حفظ انرژی بعدازظهر 💧" },
  { id: 3004, hour: 19, minute: 0, body: "آب امروزت رو چک کردی؟ 💧" },
  { id: 3005, hour: 21, minute: 0, body: "آخرین یادآور آب امروز قبل از خواب 💧" },
];

export interface NotificationPrefs {
  restTimerAlert: boolean;
  workoutReminderEnabled: boolean;
  workoutReminderHour: number;
  workoutReminderMinute: number;
  waterRemindersEnabled: boolean;
  pushEnabled: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  restTimerAlert: true,
  workoutReminderEnabled: false,
  workoutReminderHour: 18,
  workoutReminderMinute: 0,
  waterRemindersEnabled: false,
  pushEnabled: false,
};

let pushListenersBound = false;

export function getNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    return {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...(JSON.parse(raw) as Partial<NotificationPrefs>),
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage write failures.
  }
}

export function getSavedApnsToken(): string | null {
  try {
    return localStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function ensureLocalNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return true;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === "granted";
  } catch {
    return false;
  }
}

/**
 * Schedules a local iOS notification for the exact wall-clock moment a rest
 * period ends, so the alert still fires with sound & haptics if the screen is
 * locked or the user switches apps.
 */
export async function scheduleRestFinishedNotification(
  endAtMs: number,
  exerciseName: string,
): Promise<void> {
  if (!isNativeApp()) return;

  const prefs = getNotificationPrefs();
  if (!prefs.restTimerAlert) return;

  const delayMs = endAtMs - Date.now();
  if (delayMs < 1500) return;

  if (isNativeIos()) {
    try {
      await GampetooNative.scheduleRestNotification({
        endAtUnixSeconds: endAtMs / 1000,
        exerciseName,
      });
      return;
    } catch {
      // Fall back to Capacitor LocalNotifications if native method is unavailable.
    }
  }

  const granted = await ensureLocalNotificationPermission();
  if (!granted) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: REST_TIMER_NOTIFICATION_ID }],
    });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REST_TIMER_NOTIFICATION_ID,
          title: "زمان استراحت تمام شد ⏱️",
          body: `آماده برای ست بعدی «${exerciseName}»`,
          schedule: { at: new Date(endAtMs), allowWhileIdle: true },
          sound: "default",
        },
      ],
    });
  } catch {
    // Non-fatal: in-app timer still runs normally.
  }
}

export async function cancelRestFinishedNotification(): Promise<void> {
  if (!isNativeApp()) return;

  if (isNativeIos()) {
    try {
      await GampetooNative.cancelRestNotification();
    } catch {
      // Ignore cancel errors.
    }
  }

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: REST_TIMER_NOTIFICATION_ID }],
    });
    await LocalNotifications.removeDeliveredNotifications({
      notifications: [{ id: REST_TIMER_NOTIFICATION_ID, title: "", body: "" }],
    });
  } catch {
    // Ignore cancel errors.
  }
}

/**
 * Clears delivered notifications from Notification Center (and resets app badge)
 * so completed rest timers, water reminders, and daily workout alerts never
 * pile up once finished or once the user opens the app.
 */
export async function clearDeliveredNotifications(): Promise<void> {
  if (!isNativeApp()) return;

  if (isNativeIos()) {
    try {
      await GampetooNative.clearDeliveredNotifications();
    } catch {
      // Ignore native clear failures.
    }
  }

  try {
    await LocalNotifications.removeAllDeliveredNotifications();
  } catch {
    // Ignore plugin clear failures.
  }
}

/**
 * Reconciles recurring daily workout & hydration reminders against saved user
 * preferences. Safe to call after settings save or on app startup.
 */
export async function syncDailyReminders(
  prefs: NotificationPrefs = getNotificationPrefs(),
): Promise<{ granted: boolean }> {
  if (!isNativeApp()) return { granted: false };

  const idsToClear = [
    WORKOUT_REMINDER_ID,
    ...WATER_REMINDER_SCHEDULE.map((item) => item.id),
  ];

  try {
    await LocalNotifications.cancel({
      notifications: idsToClear.map((id) => ({ id })),
    });
  } catch {
    // Continue even if nothing was pending.
  }

  const needsPermission = prefs.workoutReminderEnabled || prefs.waterRemindersEnabled;
  if (!needsPermission) {
    return { granted: true };
  }

  const granted = await ensureLocalNotificationPermission();
  if (!granted) {
    return { granted: false };
  }

  const notifications = [];

  if (prefs.workoutReminderEnabled) {
    notifications.push({
      id: WORKOUT_REMINDER_ID,
      title: "وقت تمرین امروزه 💪",
      body: "برنامه امروز گامپتو منتظرته — بزن بریم!",
      threadIdentifier: "gampetoo-workout-reminder",
      schedule: {
        on: {
          hour: prefs.workoutReminderHour,
          minute: prefs.workoutReminderMinute,
        },
        repeats: true,
        allowWhileIdle: true,
      },
      sound: "default",
    });
  }

  if (prefs.waterRemindersEnabled) {
    for (const slot of WATER_REMINDER_SCHEDULE) {
      notifications.push({
        id: slot.id,
        title: "یادآور آب گامپتو",
        body: slot.body,
        threadIdentifier: "gampetoo-water-reminder",
        schedule: {
          on: { hour: slot.hour, minute: slot.minute },
          repeats: true,
          allowWhileIdle: true,
        },
        sound: "default",
      });
    }
  }

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch {
      return { granted: false };
    }
  }

  return { granted: true };
}

/**
 * Uploads the device's APNs token to Supabase (`public.device_push_tokens`) so
 * server-triggered push notifications can reach this iPhone.
 */
export async function syncPushTokenToSupabase(tokenOverride?: string): Promise<void> {
  if (!supabase) return;

  const token = tokenOverride ?? getSavedApnsToken();
  if (!token) return;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    await supabase.from("device_push_tokens").upsert(
      {
        user_id: userId,
        token,
        platform: "ios",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" },
    );
  } catch {
    // Gracefully skip if the optional device_push_tokens table hasn't been
    // created in Supabase yet.
  }
}

export function initNotificationListeners(): void {
  if (!isNativeApp() || pushListenersBound) return;
  pushListenersBound = true;

  void PushNotifications.addListener("registration", (token: Token) => {
    try {
      localStorage.setItem(PUSH_TOKEN_KEY, token.value);
    } catch {
      // Ignore storage errors.
    }
    void syncPushTokenToSupabase(token.value);
  }).catch(() => {});

  void PushNotifications.addListener("registrationError", () => {
    // APNs registration only succeeds on a physical iOS device with Push
    // Notifications capability enabled — simulators report an error here.
  }).catch(() => {});
}

export async function registerForPushNotifications(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!isNativeApp()) {
    return { ok: false, error: "فقط در نسخه اپ iOS فعال است." };
  }

  initNotificationListeners();

  try {
    let status = await PushNotifications.checkPermissions();
    if (status.receive === "prompt") {
      status = await PushNotifications.requestPermissions();
    }

    if (status.receive !== "granted") {
      return {
        ok: false,
        error: "اجازه اعلان در تنظیمات آیفون رد شده است.",
      };
    }

    await PushNotifications.register();
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "ثبت دستگاه برای پوش نوتیفیکیشن انجام نشد.",
    };
  }
}

export async function sendTestPushNotification(): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!isNativeApp()) {
    return { ok: false, message: "فقط روی اپ iOS قابل تست است." };
  }

  if (!supabase) {
    return { ok: false, message: "اتصال به سرور فعال نیست." };
  }

  await syncPushTokenToSupabase();

  const { data, error } = await supabase.functions.invoke<{
    sent?: number;
    error?: string;
  }>("send-push", {
    method: "POST",
    body: { selfTest: true },
  });

  if (error) {
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        const body = (await ctx.json()) as { error?: string };
        if (body?.error) {
          return { ok: false, message: body.error };
        }
      }
    } catch {
      // Fall through to generic message below.
    }
    return {
      ok: false,
      message: "تابع send-push روی Supabase دیپلوی نشده یا تنظیمات APNs کامل نیست.",
    };
  }

  if (data?.error) {
    return { ok: false, message: data.error };
  }

  if ((data?.sent ?? 0) > 0) {
    return { ok: true, message: "پوش تستی با موفقیت ارسال شد ✅" };
  }

  return { ok: false, message: "ارسال پوش توسط APNs پذیرفته نشد." };
}
