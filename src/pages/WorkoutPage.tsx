import { useState } from "react";
import { useNavigate } from "react-router-dom";

import WorkoutHeader from "@/components/WorkoutHeader";
import WorkoutSummary from "@/components/WorkoutSummary";
import WorkoutCompleteModal from "@/components/WorkoutCompleteModal";
import WalkCompleteModal from "@/components/WalkCompleteModal";
import ExerciseCard from "@/components/ExerciseCard";
import CompleteWorkoutButton from "@/components/CompleteWorkoutButton";
import WarmupBlock from "@/components/WarmupBlock";
import SpecializedWarmupBlock from "@/components/SpecializedWarmupBlock";

import {
  getCurrentProgramDay,
  getCurrentWorkoutType,
  hasProgramStarted,
} from "@/utils/programEngine";

import { getWorkout } from "@/store/workoutLibraryStore";
import { getSpecializedWarmup } from "@/store/warmupLibraryStore";
import { walkCharacterIcon } from "@/data/characterIcons";
import type { Exercise } from "@/data/workoutLibrary";

import {
  getSession,
  completeWorkout,
  completeWalk,
  toggleExerciseChecked,
  estimateCheckedWorkoutCalories,
} from "@/utils/sessionEngine";
import { setTodayWorkoutCalories } from "@/utils/workoutCalorieEngine";
import { logActivityCalories } from "@/utils/activityLogEngine";
import { getCurrentUserGender, getCurrentUsername } from "@/utils/userEngine";
import { flushPendingSync } from "@/sync/remoteSync";

// Completing used to navigate home right after this, which is why it was
// needed in the first place: a full page navigation tears down the JS
// context before the sync engine's debounced push would otherwise fire.
// Staying on this page removes that race — the debounce still fires on its
// own — but the flush is kept anyway so the completed status reaches the
// server right away rather than waiting out the debounce regardless.
async function flushAfterCompleting() {
  const username = getCurrentUsername();

  if (username) {
    await flushPendingSync(username);
  }
}

function WorkoutPage() {
  const navigate = useNavigate();

  // resetKey is bumped to remount SlideToCompleteButton (snapping its
  // handle back to the start) when the confirm popup is cancelled — the
  // button itself has no "go back to start" API, so a fresh mount is the
  // simplest way to force it.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  // Whether the confirm popup's burned-calorie estimate should land in the
  // day's activity total. Defaults on — that's what the app did before the
  // choice existed — and deliberately isn't reset when the popup is
  // cancelled and reopened, so a user who turned it off doesn't have to
  // turn it off again.
  const [addCaloriesToActivity, setAddCaloriesToActivity] = useState(true);
  // getSession() reads straight from localStorage on every call rather than
  // being held in React state — bumping this after each checkbox tap is
  // what actually triggers the re-render that picks the fresh value up.
  const [, forceRerender] = useState(0);

  // The rest day's own slide-to-complete confirmation — mirrors
  // resetKey/confirmOpen above, same remount-to-reset trick for the
  // slider on cancel.
  const [walkConfirmOpen, setWalkConfirmOpen] = useState(false);
  const [walkResetKey, setWalkResetKey] = useState(0);

  function finishWalk(calories: number | null) {
    setWalkConfirmOpen(false);

    if (calories !== null) {
      logActivityCalories(calories);
    }

    completeWalk();
    void flushAfterCompleting();
    // getSession() re-reads localStorage on every render but nothing
    // schedules a render on its own — this is what actually surfaces the
    // "تمرین امروز رو انجام دادی" state in place, now that finishing
    // doesn't navigate away to reveal it a different way.
    forceRerender((n) => n + 1);
  }

  const session = getSession();

  // Read fresh each render rather than held anywhere, matching HomePage's
  // own hero icon — so a gender change on the profile page shows up here
  // the next time this renders too, not just on the home screen.
  const gender = getCurrentUserGender();

  function handleToggleExercise(exercise: Exercise) {
    toggleExerciseChecked(exercise.id);
    forceRerender((n) => n + 1);
  }

  const day = getCurrentProgramDay();

 const workoutType = getCurrentWorkoutType();

const workout = workoutType
  ? getWorkout(workoutType)
  : undefined;

  const isWorkout = day.activity === "workout";

  const warmupExercises = (
    getWorkout("warmup")?.groups?.flatMap(
      (group) => group.exercises ?? []
    ) ?? []
  ).filter((exercise) => exercise.enabled);

  const specializedWarmup = workoutType
    ? getSpecializedWarmup(workoutType)
    : undefined;

  const enabledSpecializedWarmupGroups = (
    specializedWarmup?.groups ?? []
  ).filter((group) => group.enabled);

  if (!hasProgramStarted()) {
    return (
      <div className="px-5 pb-5 pt-10">
        <div className="glass-panel rounded-3xl p-6 text-center">
          <p className="text-xl font-bold text-white">
            امروز تمرینی نداری
          </p>
        </div>
      </div>
    );
  }

  if (!isWorkout) {
    return (
      <div className="space-y-6 px-5 pb-5 pt-10">
        <WorkoutHeader title="روز استراحت" showForgotButton />

        <div className="glass-panel rounded-3xl p-6 text-center">
          {/* Same male/female walking illustration HomePage's hero card
              already uses for a rest day (walkCharacterIcon) — not a
              generic rest/bed icon, since the day's actual ask is the
              walk, and this way the two screens draw it identically. */}
          <img
            src={walkCharacterIcon(gender)}
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            className="mx-auto h-24 w-24 object-contain"
          />

          <p className="mt-3 text-sm text-white">
            استراحت و پیاده روی سبک به مدت ۴۵ تا ۶۰ دقیقه
          </p>
        </div>

        {!session.completed && (
          <CompleteWorkoutButton
            key={walkResetKey}
            variant="accent"
            label="پیاده روی امروز رو انجام دادم 💪🏻"
            onClick={() => setWalkConfirmOpen(true)}
          />
        )}

        {session.completed && (
          <div className="glass-panel mt-6 rounded-full py-4 text-center text-lg font-semibold text-white">
            تمرین امروز رو انجام دادی☺️
          </div>
        )}

        <WalkCompleteModal
          open={walkConfirmOpen}
          onCancel={() => {
            setWalkConfirmOpen(false);
            setWalkResetKey((key) => key + 1);
          }}
          onConfirm={finishWalk}
        />
      </div>
    );
  }

  const exercises = (
    workout?.groups?.flatMap(
      (group) => group.exercises ?? []
    ) ?? []
  ).filter((exercise) => exercise.enabled);

  if (!workout || exercises.length === 0) {
    return (
      <div className="space-y-6 px-5 pb-5 pt-10">
        <WorkoutHeader title={day.title} showForgotButton />

        <div className="glass-panel rounded-3xl p-2 text-center">

          <p className="m-3 text-white">
            برای این تمرین هنوز حرکتی انتخاب نشده.
            {/* <h2>در کتابخانه تمرین ها حرکت های مورد نظر خود را انتخاب کنید</h2> */}
          </p>
        </div>

        {!session.completed && (
          <CompleteWorkoutButton
            label="رفتن به کتابخانه تمرین‌ها"
            onClick={() => {
              navigate(
                workoutType
                  ? `/settings/workouts/${workoutType}`
                  : "/settings/workouts"
              );
            }}
          />
        )}

        {session.completed && (
          <div className="glass-panel mt-6 rounded-full py-4 text-center text-lg font-semibold text-white">
            تمرین امروز رو انجام دادی ☺️
          </div>
        )}
      </div>
    );
  }

  const totalSets = exercises.reduce(
  (sum, exercise) => sum + exercise.sets,
  0
);

  // Derived from the checklist on every render rather than accumulated as
  // exercises are ticked, so it always matches what's actually checked off
  // right now. Nothing has been written anywhere yet at this point — that
  // only happens if the user confirms with the toggle on.
  const checkedCalories = estimateCheckedWorkoutCalories(
    exercises,
    session.checkedExercises,
  );

  const checkedExerciseIds = new Set(session.checkedExercises);
  // A stable sort just sinks checked-off exercises to the bottom, keeping
  // both groups in their original relative order — no re-shuffling within
  // "still to do" or "already done" as you check more of them off.
  const sortedExercises = [...exercises].sort(
    (a, b) =>
      Number(checkedExerciseIds.has(a.id)) - Number(checkedExerciseIds.has(b.id)),
  );

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      <WorkoutHeader title={workout.title} showForgotButton />

      <WarmupBlock exercises={warmupExercises} />

      {specializedWarmup && (
        <SpecializedWarmupBlock
          title={`🎯 ${specializedWarmup.title}`}
          groups={enabledSpecializedWarmupGroups}
        />
      )}

      <div className="space-y-4">
        {sortedExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            checked={checkedExerciseIds.has(exercise.id)}
            onToggleChecked={() => handleToggleExercise(exercise)}
          />
        ))}
      </div>

      {!session.completed && (
        <CompleteWorkoutButton
          key={resetKey}
          variant="accent"
          label="تمرین امروز رو انجام دادم 💪🏻"
          onClick={() => setConfirmOpen(true)}
        />
      )}

      {/* The exercise/set counts only show up here now, once the workout is
          actually done — not while it's still in progress above the list,
          where they were just noise repeating what the checklist itself
          already shows. */}
      {session.completed && (
        <div className="glass-panel mt-6 space-y-3 rounded-3xl p-5 text-center">
          <p className="text-lg font-semibold text-white">
            تمرین امروز رو انجام دادی☺️
          </p>

          <p className="text-sm text-white/70">خلاصه تمرین امروز</p>

          <WorkoutSummary exercises={exercises.length} sets={totalSets} />
        </div>
      )}

      <WorkoutCompleteModal
        open={confirmOpen}
        workoutTitle={workout.title}
        exercises={exercises.length}
        sets={totalSets}
        calories={checkedCalories}
        addToActivity={addCaloriesToActivity}
        onToggleAddToActivity={() => setAddCaloriesToActivity((on) => !on)}
        onCancel={() => {
          setConfirmOpen(false);
          setResetKey((key) => key + 1);
        }}
        onConfirm={() => {
          setConfirmOpen(false);
          // The only path that ever writes the day's workout-calorie total.
          // Written unconditionally so turning the toggle off is an explicit
          // zero rather than leaving whatever happened to be there — and it
          // sets rather than adds, so confirming twice in a day can't double
          // it (see workoutCalorieEngine).
          setTodayWorkoutCalories(addCaloriesToActivity ? checkedCalories : 0);
          completeWorkout();
          void flushAfterCompleting();
          // Same reason as finishWalk: nothing else schedules a re-render,
          // and this is what actually shows the "انجام دادی" summary in
          // place now that confirming stays on this page.
          forceRerender((n) => n + 1);
        }}
      />
    </div>
  );
}

export default WorkoutPage;