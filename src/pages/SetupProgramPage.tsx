import { useState } from "react";

const persianDays = [
  "اول",
  "دوم",
  "سوم",
  "چهارم",
  "پنجم",
  "ششم",
  "هفتم",
  "هشتم",
  "نهم",
  "دهم",
];

import type {
  WorkoutDay,
  WorkoutType,
} from "@/types/program";

import {
  getActiveProgram,
  updateProgram,
} from "@/utils/programEngine";

import { resetSession } from "@/utils/sessionEngine";

const workoutOptions: {
  id: WorkoutType;
  title: string;
}[] = [
  { id: "push", title: "Push" },
  { id: "pull", title: "Pull" },
  { id: "legs", title: "Legs" },
  { id: "upper", title: "Upper" },
  { id: "lower", title: "Lower" },
  { id: "full_body", title: "Full Body" },
  { id: "cardio", title: "Cardio" },
  { id: "custom", title: "Custom" },
];

export default function SetupProgramPage() {
  const today = new Date().toISOString().split("T")[0];

  const program = getActiveProgram();

  const [startDate, setStartDate] = useState(
    program.startDate || today
  );

  const [days, setDays] = useState<WorkoutDay[]>([]);

  function addWorkoutDay(type: WorkoutType) {
    setDays((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        workoutId: type,
        title: workoutOptions.find((w) => w.id === type)?.title ?? "",
        activity: "workout",
    
      },
      
    ]);
    setActivity(null);
  setSelectedWorkout(null);
  }

  function addWalkDay() {
    setDays((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        workoutId: null,
        title: "Walk",
        activity: "walk",
      },
    ]);
  }

  function removeDay(id: string) {
    setDays((prev) => prev.filter((d) => d.id !== id));
  }
const [activity, setActivity] =
  useState<"workout" | "walk" | null>(null);

const [selectedWorkout, setSelectedWorkout] =
  useState<WorkoutType | null>(null);

  function handleFinish() {
    if (!startDate) return;

    if (days.length === 0) return;

    updateProgram({
      ...program,
      startDate,

      workout: {
        ...program.workout,
        days,
      },
    });

    resetSession();

    window.location.replace("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10">
      <div className="mx-auto flex max-w-xl flex-col space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            برنامه روزانه
          </h1>

          <p className="mt-2 text-zinc-400">
            برنامه روزانه خودت رو بساز
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <label className="mb-3 block text-center text-sm font-medium text-zinc-400">
            تاریخ شروع
          </label>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-white"
          />
        </div>

       <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5 text-center">
  
  
  <h2 className="text-xl font-bold text-white">
   روز {persianDays[days.length] ?? `${days.length + 1}`}
  </h2>

  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={() => setActivity("workout")}
      className={`rounded-xl py-4 font-bold ${
        activity === "workout"
          ? "bg-emerald-500 text-black"
          : "bg-zinc-800 text-white"
      }`}
    >
      تمرین
    </button>

    <button
      onClick={() => setActivity("walk")}
      className={`rounded-xl py-4 font-bold ${
        activity === "walk"
          ? "bg-emerald-500 text-black"
          : "bg-zinc-800 text-white"
      }`}
    >
      استراحت
    </button>
  </div>

  {activity === "workout" && (
    <div className="grid grid-cols-2 gap-3">
      {workoutOptions.map((item) => (
        <button
          key={item.id}
          onClick={() => setSelectedWorkout(item.id)}
          className={`rounded-xl py-3 ${
            selectedWorkout === item.id
              ? "bg-emerald-500 text-black"
              : "bg-zinc-800 text-white"
          }`}
        >
          {item.title}
        </button>
      ))}
    </div>
  )}

  <button
    onClick={() => {
      if (activity === "walk") {
        addWalkDay();
      }

      if (
        activity === "workout" &&
        selectedWorkout
      ) {
        addWorkoutDay(selectedWorkout);
      }

      setActivity(null);
      setSelectedWorkout(null);
    }}
    className="w-full rounded-xl bg-emerald-500 py-4 font-bold text-black"
  >
    بریم روز بعد!
  </button>
</div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <h2 className="mb-4 text-xl font-bold text-white">
            چرخه برنامه
          </h2>

          <div className="space-y-3">
            {days.map((day, index) => (
              <div
                key={day.id}
                className="flex items-center justify-between rounded-xl bg-zinc-800 p-4"
              >
                <div>
                  <p className="font-bold text-white">
                    Day {index + 1}
                  </p>

                  <p className="text-zinc-400">
  {day.activity === "walk" ? "Recovery / Walk" : day.title}
</p>
                </div>

                <button
                  onClick={() => removeDay(day.id)}
                  className="text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
  onClick={handleFinish}
  disabled={days.length === 0}
  className="w-full rounded-2xl bg-emerald-500 py-4 text-xl font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
>
  پایان برنامه
</button>
      </div>
    </div>
  );
}