import { useState } from "react";
import { useNavigate } from "react-router-dom";

import WorkoutHeader from "@/components/WorkoutHeader";
import WorkoutSummary from "@/components/WorkoutSummary";
import WorkoutCompleteModal from "@/components/WorkoutCompleteModal";
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
import type { Exercise } from "@/data/workoutLibrary";

import {
  getSession,
  completeWorkout,
  completeWalk,
  toggleExerciseChecked,
  estimateCheckedWorkoutCalories,
} from "@/utils/sessionEngine";
import { setTodayWorkoutCalories } from "@/utils/workoutCalorieEngine";
import { getCurrentUsername } from "@/utils/userEngine";
import { flushPendingSync } from "@/sync/remoteSync";

// A full page navigation tears down the JS context before the sync engine's
// debounced push would otherwise fire — flush first so today's completed
// status actually reaches the server instead of only staying local.
async function goHomeAfterCompleting() {
  const username = getCurrentUsername();

  if (username) {
    await flushPendingSync(username);
  }

  window.location.href = "/";
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

  const session = getSession();

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
          <div className="text-3xl">🚶</div>

          <h2 className="mt-3 text-xl font-bold text-white">
            امروز روز استراحت توئه
          </h2>

          <p className="mt-3 text-sm text-white">
            به مدت ۴۵ تا ۶۰ دقیقه پیاده روی سبک داشته باش
          </p>
        </div>

        {!session.completed && (
          <CompleteWorkoutButton
            variant="accent"
            label="پیاده روی امروز رو انجام دادم 💪🏻"
            onClick={() => {
              completeWalk();
              void goHomeAfterCompleting();
            }}
          />
        )}

        {session.completed && (
          <div className="glass-panel mt-6 rounded-full py-4 text-center text-lg font-semibold text-white">
            تمرین امروز رو انجام دادی☺️
          </div>
        )}
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

      <p className="text-center text-sm text-white">
        خلاصه تمرین امروز
      </p>

      <WorkoutSummary
  exercises={exercises.length}
  sets={totalSets}
/>

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

      {session.completed && (
        <div className="glass-panel mt-6 rounded-full py-4 text-center text-lg font-semibold text-white">
          تمرین امروز رو انجام دادی☺️
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
          void goHomeAfterCompleting();
        }}
      />
    </div>
  );
}

export default WorkoutPage;