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
  // Small, muted label under the title — e.g. the workout-plan name
  // ("پوش B") next to the workout's own title ("پوش"), which used to be
  // appended straight into `title` as one string ("پوش — پوش B") and read
  // as one big, cluttered heading. Kept distinct from `subtitle` (which
  // sits above the title, same size as body text) since this is deliberately
  // smaller and secondary to the title rather than a caption leading into it.
  belowTitle?: string;
  // WorkoutHeader is also reused on NutritionPage — the forgot-to-log
  // button only makes sense on the actual workout page, so it's opt-in
  // rather than always-on.
  showForgotButton?: boolean;
  // Same idea as showForgotButton — a callback rather than always-on, and
  // opt-in per caller. Used by both the workout page (reorder today's
  // exercises / jump to the workout's library entry) and the nutrition
  // page (jump straight to today's meal plan settings), which is why the
  // label is caller-supplied rather than a single hardcoded string.
  onEditWorkout?: () => void;
  onEditWorkoutLabel?: string;
};

export default function WorkoutHeader({
  title,
  subtitle,
  belowTitle,
  showForgotButton = false,
  onEditWorkout,
  onEditWorkoutLabel = "تغییر ترتیب یا حرکت‌های تمرین",
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
    <div className="relative mb-4 text-center">
      {(showForgotButton || onEditWorkout) && (
        <div className="absolute end-0 top-0 flex items-center gap-2">
          {onEditWorkout && (
            <button
              onClick={onEditWorkout}
              aria-label={onEditWorkoutLabel}
              className="glass-chip glass-static flex h-10 w-10 items-center justify-center rounded-full text-white"
            >
              <Pencil size={16} />
            </button>
          )}

          {showForgotButton && (
            <button
              onClick={() => setOpen(true)}
              aria-label="فراموشی ثبت اتمام تمرین روز گذشته"
              className="glass-chip glass-static flex h-10 w-10 items-center justify-center rounded-full text-xl"
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

      {belowTitle && (
        <p className="mt-1 text-sm font-medium text-white/50">{belowTitle}</p>
      )}

      {showForgotButton && open && (
        <ModalOverlay onClose={() => setOpen(false)}>
          <div className="glass-panel glass-static rounded-3xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center glass-chip glass-static rounded-full text-2xl">
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
                className="w-full rounded-2xl glass-action glass-action-static py-3 font-bold text-white"
              >
                فراموشی ثبت تمرین
              </button>

              <button
                onClick={() => setOpen(false)}
                className="ghost-action ghost-action-static w-full rounded-2xl py-3 font-medium text-white"
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
