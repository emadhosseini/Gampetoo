import { useNavigate } from "react-router-dom";
import { resetApplication } from "../domain/reset/resetApplication.ts";
import { logoutCurrentUser } from "@/utils/userEngine";

// Hidden for now (not ready to expose to users yet) — keep the handler/markup
// in place so it can be turned back on with a one-line flip.
const SHOW_SWITCH_USER_BUTTON = false;

export default function SettingsPage() {
  const navigate = useNavigate();

  function handleSwitchUser() {
    const confirmed = window.confirm(
      "از این حساب خارج می‌شوی و می‌تونی نام کاربری دیگه‌ای وارد کنی. اطلاعات این حساب پاک نمی‌شه و هر وقت دوباره همین نام کاربری رو وارد کنی برمی‌گرده.\n\nادامه می‌دی؟"
    );

    if (!confirmed) {
      return;
    }

    logoutCurrentUser();

    navigate("/setup", {
      replace: true,
    });
  }

  function handleReset() {
    const confirmed = window.confirm(
      "تمام اطلاعات برنامه، جلسات ثبت‌شده و پیشرفت شما حذف می‌شود و امکان بازگردانی وجود ندارد.\n\nآیا مطمئن هستید؟"
    );

    if (!confirmed) {
      return;
    }

    resetApplication();

    navigate("/setup", {
      replace: true,
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col p-5">
      <div className="space-y-6">
        <div className="mb-6 mt-4 text-center">
          <h1 className="text-3xl font-bold">
            تنظیمات
          </h1>
        </div>

        <button
          onClick={() => navigate("/settings/workouts")}
          className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              کتابخانه تمرین‌ها
            </h2>

            <p className="text-sm text-zinc-500">
              مدیریت تمرین‌ها و حرکات
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("/settings/program")}
          className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              برنامه تمرینی
            </h2>

            <p className="text-sm text-zinc-500">
              مدیریت روزهای برنامه و انتخاب تمرین هر روز
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("/settings/nutrition")}
          className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              برنامه غذایی
            </h2>

            <p className="text-sm text-zinc-500">
              انتخاب وعده‌ها و غذاهای برنامه تمرین و استراحت
            </p>
          </div>
        </button>
        {SHOW_SWITCH_USER_BUTTON && (
          <button
            onClick={handleSwitchUser}
            className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                تغییر کاربر
              </h2>

              <p className="text-sm text-zinc-500">
                خروج از این حساب و ورود با نام کاربری دیگر
              </p>
            </div>
          </button>
        )}
      </div>

      <button
        onClick={handleReset}
        className="mx-auto mt-auto w-fit rounded-xl border border-red-300 bg-red-50 p-3 text-center text-red-600 shadow-sm transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
      >
        <h2 className="whitespace-nowrap text-sm font-semibold">
          شروع دوباره
        </h2>

        <p className="whitespace-nowrap text-xs text-red-500">
          حذف کامل برنامه و بازگشت به صفحه راه‌اندازی
        </p>
      </button>
    </div>
  );
}