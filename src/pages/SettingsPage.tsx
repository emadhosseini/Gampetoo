import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-5">
      <h1 className="text-2xl font-bold">
        تنظیمات
      </h1>

      <button
        onClick={() => navigate("/settings/workouts")}
        className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="text-right">
          <h2 className="text-lg font-semibold">
            کتابخانه تمرین‌ها
          </h2>

          <p className="text-sm text-zinc-500">
            مدیریت تمرین‌ها و حرکات
          </p>
        </div>

        <ChevronRight className="h-5 w-5 text-zinc-400" />
      </button>
    </div>
  );
}