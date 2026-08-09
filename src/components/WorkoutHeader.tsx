import { useState } from "react";
import { Pencil } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import { shiftProgramOneDayForward } from "@/utils/programEngine";
import { resetSession } from "@/utils/sessionEngine";

type WorkoutHeaderProps = {
  title: string;
  // No default anymore — "برنامه امروز"/"تغذیه امروز" above every day title
  // was one more label saying what the page already says by being on it.
  // Left as an opt-in prop rather than deleted outright since nothing
  // currently passes one, but a future screen reusing this header might
  // still want a real caption above its title (not a repeat of "today").
  subtitle?: string;
  // WorkoutHeader is also reused on NutritionPage — the forgot-to-log
  // button only makes sense on the actual workout page, so it's opt-in
  // rather than always-on.
  showForgotButton?: boolean;
  // Same idea as showForgotButton — only WorkoutPage has anything to edit
  // (reorder today's exercises / jump to the workout's library entry), so
  // this is a callback rather than always-on. Sits right beside the forgot
  // button rather than as its own separate control lower on the page.
  onEditWorkout?: () => void;
};

export default function WorkoutHeader({
  title,
  subtitle,
  showForgotButton = false,
  onEditWorkout,
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
      {(showForgotButton || onEditWorkout) && (
        <div className="absolute end-0 top-0 flex items-center gap-2">
          {onEditWorkout && (
            <button
              onClick={onEditWorkout}
              aria-label="تغییر ترتیب یا حرکت‌های تمرین"
              className="glass-chip flex h-10 w-10 items-center justify-center rounded-full text-white"
            >
              <Pencil size={16} />
            </button>
          )}

          {showForgotButton && (
            <button
              onClick={() => setOpen(true)}
              aria-label="فراموشی ثبت اتمام تمرین روز گذشته"
              className="glass-chip flex h-10 w-10 items-center justify-center rounded-full text-xl"
            >
              🤦
            </button>
          )}
        </div>
      )}

      {subtitle && <p className="text-sm text-white">{subtitle}</p>}

      <h1 className={`${subtitle ? "mt-1" : ""} text-3xl font-bold`}>
        {title}
      </h1>

      {showForgotButton && open && (
        <ModalOverlay onClose={() => setOpen(false)}>
          <div className="glass-panel glass-static rounded-3xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center glass-chip rounded-full text-2xl">
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
                className="w-full rounded-2xl glass-action py-3 font-bold text-white"
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
        </ModalOverlay>
      )}
    </div>
  );
}
