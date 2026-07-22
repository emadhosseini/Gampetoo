import { useNavigate } from "react-router-dom";
import { resetApplication } from "../domain/reset/resetApplication.ts";
import { logoutCurrentUser } from "@/utils/userEngine";
import { signOutRemote } from "@/auth/authEngine";

export default function SettingsPage() {
  const navigate = useNavigate();

  function handleLogout() {
    const confirmed = window.confirm(
      "از حساب کاربریت خارج می‌شی و به صفحه اول برمی‌گردی. اطلاعات و تنظیمات این حساب پاک نمی‌شه و هر وقت دوباره با همین نام کاربری وارد بشی، همه‌چیز برمی‌گرده.\n\nادامه می‌دی؟"
    );

    if (!confirmed) {
      return;
    }

    void signOutRemote();
    logoutCurrentUser();

    navigate("/setup", {
      replace: true,
    });
  }

  async function handleReset() {
    const confirmed = window.confirm(
      "تمام اطلاعات برنامه، جلسات ثبت‌شده و پیشرفت شما حذف می‌شود و امکان بازگردانی وجود ندارد.\n\nآیا مطمئن هستید؟"
    );

    if (!confirmed) {
      return;
    }

    await resetApplication();

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
          className="glass-panel w-full rounded-2xl p-5"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              کتابخانه تمرین‌ها
            </h2>

            <p className="text-sm text-white">
              مدیریت تمرین‌ها و حرکات
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("/settings/program")}
          className="glass-panel w-full rounded-2xl p-5"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              برنامه تمرینی
            </h2>

            <p className="text-sm text-white">
              مدیریت روزهای برنامه و انتخاب تمرین هر روز
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("/settings/nutrition")}
          className="glass-panel w-full rounded-2xl p-5"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              برنامه غذایی
            </h2>

            <p className="text-sm text-white">
              انتخاب وعده‌ها و غذاهای برنامه تمرین و استراحت
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("/settings/weight")}
          className="glass-panel w-full rounded-2xl p-5"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              ثبت وزن و نمودار وزنی
            </h2>

            <p className="text-sm text-white">
              ثبت وزن روزانه و مشاهده روند تغییرات
            </p>
          </div>
        </button>
      </div>

      <div className="mx-auto mt-auto flex w-full max-w-sm gap-3">
        <button
          onClick={handleLogout}
          className="glass-tap flex-1 rounded-xl border border-forest-600 bg-forest-700/50 backdrop-blur-xl p-3 text-center text-white transition hover:bg-forest-700/70"
        >
          <h2 className="text-sm font-semibold">
            خروج از حساب کاربری
          </h2>

          <p className="text-xs text-white">
            بدون پاک شدن اطلاعات و تنظیمات
          </p>
        </button>

        <button
          onClick={() => void handleReset()}
          className="glass-tap flex-1 rounded-xl border border-red-900 bg-red-950/30 backdrop-blur-xl p-3 text-center text-white transition hover:bg-red-950/50"
        >
          <h2 className="text-sm font-semibold">
            پاک کردن حساب کاربری
          </h2>

          <p className="text-xs text-white">
            حذف کامل برنامه و پاک کردن اطلاعات
          </p>
        </button>
      </div>
    </div>
  );
}