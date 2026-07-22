import { useState } from "react";

import { shiftProgramOneDayForward } from "@/utils/programEngine";
import { resetSession } from "@/utils/sessionEngine";

type WorkoutHeaderProps = {
  title: string;
  subtitle?: string;
  // WorkoutHeader is also reused on NutritionPage — the forgot-to-log
  // button only makes sense on the actual workout page, so it's opt-in
  // rather than always-on.
  showForgotButton?: boolean;
};

export default function WorkoutHeader({
  title,
  subtitle = "برنامه امروز",
  showForgotButton = false,
}: WorkoutHeaderProps) {
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    // Shifts the program cycle one day forward (startDate moves back a day)
    // so today shows what would have been tomorrow's workout, instead of
    // repeating the one that was actually done yesterday but never logged.
    shiftProgramOneDayForward();
    resetSession();

    window.location.href = "/";
  }

  return (
    <div className="relative mb-6 mt-4 text-center">
      {showForgotButton && (
        <button
          onClick={() => setOpen(true)}
          aria-label="فراموشی ثبت اتمام تمرین روز گذشته"
          className="glass-chip absolute end-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-xl"
        >
          🤦
        </button>
      )}

      <p className="text-sm text-white">{subtitle}</p>

      <h1 className="mt-1 text-3xl font-bold">
        {title}
      </h1>

      {showForgotButton && open && (
        <div className="pt-safe fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-forest-600 bg-forest-700 p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-avocado-yellow/10 text-2xl">
              🤦
            </div>

            <h2 className="mt-4 text-lg font-bold text-white">
              یادت رفته دیروز رو ثبت کنی؟
            </h2>

            <p className="mt-2 text-sm leading-7 text-zinc-200">
              اگه دیروز تمرینت رو انجام دادی ولی یادت رفت ثبتش کنی، با این
              گزینه چرخه‌ی برنامه یک روز جلو می‌ره — یعنی برنامه‌ی امروز،
              همون برنامه‌ای می‌شه که قرار بود فردا باشه.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                className="w-full rounded-2xl bg-avocado-yellow py-3 font-bold text-black"
              >
                فراموشی ثبت تمرین
              </button>

              <button
                onClick={() => setOpen(false)}
                className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
