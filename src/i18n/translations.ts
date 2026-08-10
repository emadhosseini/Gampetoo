// One dictionary per language, both sharing the exact same key set —
// t() (see ./t.ts) falls back to fa on a missing en key so a half-translated
// page still renders instead of showing a raw key. Keys are namespaced
// "page.thing" by the screen they first appeared on, not by literal text,
// so the same string reused across pages doesn't fork into copies that can
// drift apart.
export const translations = {
  fa: {
    "home.setupTitle": "شروع کن",
    "home.setupStatus": "برنامه روزانه تمرینی رو انتخاب کنید",
    "home.tomorrowPlan": "برنامه فردا",
    "home.noTomorrowPlan": "فردا برنامه‌ای نداری\nاستراحت و پیاده روی کن",
    "home.rest": "استراحت",
    "home.noTodayPlan": "امروز برنامه‌ای نداری",
    "home.restDay": "روز استراحت",
    "home.startsTomorrow": "اولین برنامه فردا شروع می‌شه",
    "home.startsInDays": "اولین برنامه از {days} روز دیگه شروع می‌شه",
    "home.todayStatus": "وضعیت برنامه امروز",
    "home.done": "انجام شده ✅",
    "home.notDone": "انجام نشده",
  },
  en: {
    "home.setupTitle": "Get started",
    "home.setupStatus": "Pick your daily workout program",
    "home.tomorrowPlan": "Tomorrow's plan",
    "home.noTomorrowPlan": "Nothing planned for tomorrow\nRest and go for a walk",
    "home.rest": "Rest",
    "home.noTodayPlan": "Nothing planned for today",
    "home.restDay": "Rest day",
    "home.startsTomorrow": "Your first workout starts tomorrow",
    "home.startsInDays": "Your first workout starts in {days} days",
    "home.todayStatus": "Today's status",
    "home.done": "Done ✅",
    "home.notDone": "Not done",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["fa"];
