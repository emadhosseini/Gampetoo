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
import { getWorkoutOptions } from "@/store/workoutLibraryStore";
import {
  getCurrentUserName,
  setCurrentUserName,
} from "@/utils/userEngine";
import { generateId } from "@/utils/id";

export default function SetupProgramPage() {
  const [userName, setUserNameInput] = useState(
    () => getCurrentUserName() ?? ""
  );

  const [nameConfirmed, setNameConfirmed] = useState(
    () => !!getCurrentUserName()
  );

  if (!nameConfirmed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-10">
        <div className="mx-auto flex w-full max-w-xl flex-col space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">
              Movana
            </h1>

            <p className="mt-2 text-zinc-400">
              اول از همه، اسمت رو وارد کن
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5 text-center">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserNameInput(e.target.value)}
              placeholder="اسم شما"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-center text-white"
            />

            <button
              onClick={() => {
                const trimmed = userName.trim();

                if (!trimmed) return;

                setCurrentUserName(trimmed);
                setNameConfirmed(true);
              }}
              disabled={!userName.trim()}
              className="w-full rounded-2xl bg-emerald-500 py-4 text-xl font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              ادامه
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <ProgramCycleSetup />;
}

function ProgramCycleSetup() {
  const today = new Date().toISOString().split("T")[0];

  const program = getActiveProgram();

  const workoutOptions = getWorkoutOptions();

  const [startDate, setStartDate] = useState(
    program.startDate || today
  );

  const [days, setDays] = useState<WorkoutDay[]>([]);

  const [activity, setActivity] =
    useState<"workout" | "walk" | null>(null);

  const [selectedWorkout, setSelectedWorkout] =
    useState<WorkoutType | null>(null);

  function addWorkoutDay(type: WorkoutType) {
    setDays((prev) => [
      ...prev,
      {
        id: generateId(),
        workoutId: type,
        title:
          workoutOptions.find((w) => w.id === type)?.title ?? "",
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
        id: generateId(),
        workoutId: null,
        title: "Walk",
        activity: "walk",
      },
    ]);

    setActivity(null);
    setSelectedWorkout(null);
  }

  function removeDay(id: string) {
    setDays((prev) => prev.filter((d) => d.id !== id));
  }

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
            Movana
          </h1>

          <p className="mt-2 text-zinc-400">
            برنامه تمرینی روزانه خودت رو بساز
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5 text-center">
          <h2 className="text-xl font-bold text-white">
            روز {persianDays[days.length] ?? `${days.length + 1}`}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActivity("workout")}
              className={`rounded-xl py-4 font-bold transition-colors ${
                activity === "workout"
                  ? "bg-emerald-500 text-black"
                  : "bg-zinc-800 text-white"
              }`}
            >
              تمرین
            </button>

            <button
              onClick={() => setActivity("walk")}
              className={`rounded-xl py-4 font-bold transition-colors ${
                activity === "walk"
                  ? "bg-emerald-500 text-black"
                  : "bg-zinc-800 text-white"
              }`}
            >
              استراحت
            </button>
          </div>
          {activity === "workout" && (
            <>
              <p className="text-sm text-zinc-400">
                یکی از تمرین‌های زیر را انتخاب کنید.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {workoutOptions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedWorkout(item.id)}
                    className={`rounded-xl py-3 font-bold transition-colors ${
                      selectedWorkout === item.id
                        ? "bg-emerald-500 text-black"
                        : "bg-zinc-800 text-white"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </>
          )}
                    <button
            onClick={() => {
              if (activity === null) {
                window.alert(
                  "لطفاً یکی از گزینه‌های تمرین یا استراحت رو انتخاب کن."
                );
                return;
              }

              if (activity === "workout" && !selectedWorkout) {
                window.alert(
                  "باید حتماً یک تمرین رو انتخاب کنی."
                );
                return;
              }

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
            className="w-full rounded-xl bg-amber-500 py-4 font-bold text-black"
          >
          روز بعدی!
          </button>
        </div>

        {days.length > 0 && (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
    <h2 className="mb-4 text-xl font-bold text-white">
      {/* میخوام تعداد روز انتخاب شدهرو اینجا بنویسه */}
      چرخه برنامه
    </h2>

    <div className="space-y-3">
      {days.map((day, index) => (
        <div
          key={day.id}
          className="flex items-center justify-between rounded-xl bg-zinc-800 p-4"
        >
          <div className="flex-1 text-right">
            <p className="font-bold text-white">
              روز {persianDays[index] ?? `${index + 1}`}
            </p>

            <p className="text-zinc-400">
              {day.activity === "walk"
                ? "استراحت و پیاده‌روی سبک"
                : day.title}
            </p>
          </div>

          <button
            onClick={() => removeDay(day.id)}
            className="text-red-400"
          >
            حذف
          </button>
        </div>
      ))}
    </div>
  </div>
)}
  {days.length > 0 && (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
    <label className="mb-3 block text-center text-sm font-medium text-zinc-400">
     از چه تاریخی این چرخه آغاز شود؟
    </label>

    <input
      type="date"
      dir="ltr"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-center text-white [&::-webkit-date-and-time-value]:text-center"
    />
  </div>
)}
        <button
  onClick={handleFinish}
  disabled={days.length === 0 || !startDate}
  className="w-full rounded-2xl bg-emerald-500 py-4 text-xl font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
>
  شروع برنامه
</button>
      </div>
    </div>
  );
}