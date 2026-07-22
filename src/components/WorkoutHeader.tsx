import { useState } from "react";

import { completeWorkout } from "@/utils/sessionEngine";

type WorkoutHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function WorkoutHeader({
  title,
  subtitle = "برنامه امروز",
}: WorkoutHeaderProps) {
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    completeWorkout();
    // No reactive state layer ties WorkoutPage's "انجام دادی" badge to this
    // write — a full reload is how the rest of the app already handles this
    // (see ProgramBuilderPage after updateWorkoutDay).
    window.location.reload();
  }

  return (
    <div className="relative mb-6 mt-4 text-center">
      <button
        onClick={() => setOpen(true)}
        aria-label="فراموشی ثبت اتمام تمرین روز گذشته"
        className="glass-chip absolute end-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-xl"
      >
        🤦
      </button>

      <p className="text-sm text-white">{subtitle}</p>

      <h1 className="mt-1 text-3xl font-bold">
        {title}
      </h1>

      {open && (
        <div className="pt-safe fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-forest-600 bg-forest-700 p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-avocado-yellow/10 text-2xl">
              🤦
            </div>

            <h2 className="mt-4 text-lg font-bold text-white">
              یادت رفته ثبتش کنی؟
            </h2>

            <p className="mt-2 text-sm leading-7 text-zinc-200">
              اگه تمرینت رو انجام دادی ولی یادت رفت به‌موقع دکمه «انجام دادم»
              رو بزنی، با این گزینه می‌تونی همین الان تمرین امروز رو
              به‌عنوان انجام‌شده ثبت کنی.
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
