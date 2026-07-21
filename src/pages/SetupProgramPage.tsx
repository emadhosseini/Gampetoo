import { useState } from "react";

import DatePickerImport, { DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian";

// react-multi-date-picker ships as CommonJS; depending on the bundler's interop
// the default import can arrive as the module namespace rather than the component.
const DatePicker =
  (DatePickerImport as unknown as { default?: typeof DatePickerImport })
    .default ?? DatePickerImport;
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import "react-multi-date-picker/styles/colors/green.css";

import MeshGradientBackground from "@/components/background/MeshGradientBackground";
import InstallHint from "@/components/InstallHint";

// startDate is stored as a Gregorian ISO date (YYYY-MM-DD). These convert to and
// from a local JS Date without the UTC-parsing off-by-one that new Date("...") has.
function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);

  return new Date(y, m - 1, d);
}

function dateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}


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
  hasStartDate,
  updateProgram,
} from "@/utils/programEngine";

import { resetSession } from "@/utils/sessionEngine";
import { getWorkoutOptions } from "@/store/workoutLibraryStore";
import {
  getCurrentUserName,
  getCurrentUsername,
  hasCurrentUsername,
  hasLegacyData,
  migrateLegacyDataTo,
  setCurrentUsername,
  setCurrentUserName,
} from "@/utils/userEngine";
import { generateId } from "@/utils/id";
import { isSyncConfigured } from "@/lib/supabaseClient";
import { MIN_PIN_LENGTH, signInOrSignUp } from "@/auth/authEngine";
import { flushPendingSync, syncAfterLogin } from "@/sync/remoteSync";

// Username must be English only (letters, digits, and . _ - separators).
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export default function SetupProgramPage() {
  const [step, setStep] = useState<"account" | "program">(
    () => (hasCurrentUsername() ? "program" : "account")
  );

  if (step === "account") {
    return <AccountStep onNewAccount={() => setStep("program")} />;
  }

  return <ProgramCycleSetup />;
}

function SetupBrand() {
  return (
    <div className="flex flex-col items-center text-center">
      <img
        src="/Gampetoo.png"
        alt="Gampetoo"
        className="mb-4 h-24 w-24 object-contain"
      />

      <h1 className="text-3xl font-bold text-white">
        Gampetoo
      </h1>
    </div>
  );
}

function AccountStep({
  onNewAccount,
}: {
  onNewAccount: () => void;
}) {
  const syncEnabled = isSyncConfigured();

  const [name, setName] = useState(
    () => getCurrentUserName() ?? ""
  );

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit =
    !busy &&
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    (!syncEnabled || pin.length >= MIN_PIN_LENGTH);

  function applyLocalAccount(trimmedName: string, trimmedUsername: string) {
    // Existing users from the old name-scoped scheme carry their data over to
    // the username they pick here. This must happen BEFORE syncAfterLogin
    // below — otherwise a brand-new remote account would bootstrap-push an
    // empty snapshot (nothing exists yet under the new username-scoped keys)
    // moments before the migrated data lands, and the page navigates away
    // before that data ever gets uploaded.
    const wasLegacy = hasLegacyData();

    setCurrentUsername(trimmedUsername);

    if (wasLegacy) {
      migrateLegacyDataTo(trimmedUsername);
    }

    setCurrentUserName(trimmedName);
  }

  async function submit() {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    if (!trimmedName || !trimmedUsername) return;

    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      window.alert(
        "نام کاربری باید فقط با حروف و اعداد انگلیسی باشد."
      );
      return;
    }

    if (syncEnabled) {
      setBusy(true);

      const result = await signInOrSignUp(trimmedUsername, pin);

      if (!result.ok) {
        setBusy(false);
        window.alert(result.error ?? "ورود ناموفق بود.");
        return;
      }
    }

    applyLocalAccount(trimmedName, trimmedUsername);

    if (syncEnabled) {
      // On a brand-new remote account this uploads the (now-migrated) local
      // data as the initial snapshot; on a returning account logging in from
      // a fresh device, this pulls its existing data down instead.
      await syncAfterLogin(trimmedUsername);
      setBusy(false);
    }

    // A username that already has a configured program (existing, migrated,
    // or just pulled down from the server) goes straight into the app.
    if (hasStartDate()) {
      window.location.replace("/");
      return;
    }

    onNewAccount();
  }

  return (
    <div className="app-gradient-bg pt-safe relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <MeshGradientBackground colorA="#3b9149" colorB="#faea5c" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col space-y-8">
        <InstallHint />

        <SetupBrand />

        <div className="glass-panel rounded-2xl p-6 space-y-4 text-center">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="اسم خودت رو وارد کن"
            className="glass-chip w-full rounded-xl p-4 text-center text-white"
          />

          <input
            type="text"
            value={username}
            onChange={(e) =>
              // Strip anything that isn't English so the username stays valid.
              setUsername(e.target.value.replace(/[^A-Za-z0-9._-]/g, ""))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="نام کاربری خودت رو وارد کن"
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="glass-chip w-full rounded-xl p-4 text-center text-white"
          />

          {syncEnabled && (
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
              placeholder={`رمز خودت رو وارد کن (حداقل ${MIN_PIN_LENGTH} کاراکتر)`}
              dir="ltr"
              className="glass-chip w-full rounded-xl p-4 text-center text-white"
            />
          )}

          <button
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="glass-tap w-full rounded-2xl bg-avocado-yellow py-4 text-xl font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "..." : "ادامه"}
          </button>
        </div>
      </div>
    </div>
  );
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

  async function handleFinish() {
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

    // A full reload tears down the JS context before the normal debounced
    // push would fire — flush the just-created program up first.
    const username = getCurrentUsername();

    if (username) {
      await flushPendingSync(username);
    }

    window.location.replace("/");
  }

  return (
    <div className="app-gradient-bg pt-safe relative min-h-screen px-6 py-10">
      <MeshGradientBackground colorA="#3b9149" colorB="#faea5c" />

      <div className="relative z-10 mx-auto flex max-w-xl flex-col space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Gampetoo
          </h1>

          <p className="mt-2 text-zinc-400">
            برنامه تمرینی روزانه خودت رو بساز
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-5 text-center">
          <h2 className="text-xl font-bold text-white">
            روز {persianDays[days.length] ?? `${days.length + 1}`}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActivity("workout")}
              className={`glass-tap rounded-xl py-4 font-bold transition-colors ${
                activity === "workout"
                  ? "bg-avocado-yellow text-black"
                  : "bg-forest-600 text-white"
              }`}
            >
              تمرین
            </button>

            <button
              onClick={() => setActivity("walk")}
              className={`glass-tap rounded-xl py-4 font-bold transition-colors ${
                activity === "walk"
                  ? "bg-avocado-yellow text-black"
                  : "bg-forest-600 text-white"
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
                    className={`glass-tap rounded-xl py-3 font-bold transition-colors ${
                      selectedWorkout === item.id
                        ? "bg-avocado-yellow text-black"
                        : "bg-forest-600 text-white"
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
            className="glass-tap w-full rounded-xl bg-avocado-yellow py-4 font-bold text-black"
          >
          روز بعدی!
          </button>
        </div>

        {days.length > 0 && (
  <div className="glass-panel rounded-2xl p-6 text-center">
    <h2 className="mb-4 text-xl font-bold text-white">
      {/* میخوام تعداد روز انتخاب شدهرو اینجا بنویسه */}
      چرخه برنامه
    </h2>

    <div className="space-y-3">
      {days.map((day, index) => (
        <div
          key={day.id}
          className="glass-chip flex items-center justify-between rounded-xl p-4"
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
  <div className="glass-panel rounded-2xl p-6">
    <label className="mb-3 block text-center text-sm font-medium text-zinc-400">
     از چه تاریخی این چرخه آغاز شود؟
    </label>

    <DatePicker
      value={
        new DateObject({
          date: isoToLocalDate(startDate),
          calendar: persianCalendar,
          locale: persian_fa,
        })
      }
      onChange={(date) => {
        if (date instanceof DateObject) {
          setStartDate(dateToISO(date.toDate()));
        }
      }}
      calendar={persianCalendar}
      locale={persian_fa}
      calendarPosition="top-center"
      editable={false}
      format="D MMMM YYYY"
      className="bg-dark green"
      containerClassName="w-full"
      inputClass="glass-chip w-full rounded-xl p-4 text-center text-white"
    />
  </div>
)}
        <button
  onClick={() => void handleFinish()}
  disabled={days.length === 0 || !startDate}
  className="glass-tap w-full rounded-2xl bg-avocado-yellow py-4 text-xl font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
>
  شروع برنامه
</button>
      </div>
    </div>
  );
}