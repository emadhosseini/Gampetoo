import { useNavigate } from "react-router-dom";

import WorkoutHeader from "@/components/WorkoutHeader";
import WorkoutSummary from "@/components/WorkoutSummary";
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

import {
  getSession,
  completeWorkout,
  completeWalk,
} from "@/utils/sessionEngine";
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

  const session = getSession();

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
        <WorkoutHeader title="روز استراحت" />

        <div className="glass-panel rounded-3xl p-6 text-center">
          <div className="text-3xl">🚶</div>

          <h2 className="mt-3 text-xl font-bold text-white">
            امروز روز استراحت توئه
          </h2>

          <p className="mt-3 text-sm text-zinc-400">
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
          <div className="mt-6 rounded-2xl bg-green-500 py-4 text-center text-lg font-semibold text-black">
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
        <WorkoutHeader title={day.title} />

        <div className="glass-panel rounded-3xl p-2 text-center">

          <p className="m-3 text-zinc-400">
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
          <div className="mt-6 rounded-2xl bg-green-500 py-4 text-center text-lg font-semibold text-black">
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

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      <WorkoutHeader title={workout.title} />

      <WarmupBlock exercises={warmupExercises} />

      {specializedWarmup && (
        <SpecializedWarmupBlock
          title={`🎯 ${specializedWarmup.title}`}
          groups={enabledSpecializedWarmupGroups}
        />
      )}

      <p className="text-center text-sm text-zinc-400">
        خلاصه تمرین امروز
      </p>

      <WorkoutSummary
  exercises={exercises.length}
  sets={totalSets}
/>

      <div className="space-y-4">
        {exercises.map((exercise) =>  (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
          />
        ))}
      </div>

      {!session.completed && (
        <CompleteWorkoutButton
          variant="accent"
          label="تمرین امروز رو انجام دادم 💪🏻"
          onClick={() => {
            completeWorkout();
            void goHomeAfterCompleting();
          }}
        />
      )}

      {session.completed && (
        <div className="mt-6 rounded-2xl bg-green-500 py-4 text-center text-lg font-semibold text-black">
          تمرین امروز رو انجام دادی☺️
        </div>
      )}
    </div>
  );
}

export default WorkoutPage;