import WorkoutHeader from "@/components/WorkoutHeader";
import WorkoutSummary from "@/components/WorkoutSummary";
import ExerciseCard from "@/components/ExerciseCard";
import CompleteWorkoutButton from "@/components/CompleteWorkoutButton";

import {
  getCurrentProgramDay,
  getCurrentWorkout,
} from "@/utils/programEngine";

import {
  getSession,
  completeWorkout,
  completeWalk,
} from "@/utils/sessionEngine";

function WorkoutPage() {
  const session = getSession();

  const day = getCurrentProgramDay();

  const workout = getCurrentWorkout();

  const isWorkout = day.activity === "workout";

  if (!isWorkout) {
    return (
      <div className="space-y-6 p-5">
        <WorkoutHeader
          title="Recovery"
          day="Today's Activity"
        />

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            🚶 Recovery Walk
          </h2>

          <p className="mt-3 text-gray-500">
            Walk for 45–60 minutes at a comfortable pace.
          </p>
        </div>

        {!session.completed && (
          <CompleteWorkoutButton
            onClick={() => {
              completeWalk();
              window.location.href = "/";
            }}
          />
        )}

        {session.completed && (
          <div className="rounded-3xl bg-green-50 p-5 text-center font-bold text-green-700">
            ✅ Today's activity completed
          </div>
        )}
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="space-y-6 p-5">
        <WorkoutHeader
          title={day.title}
          day="Today's Workout"
        />

        <div className="rounded-3xl bg-white p-6 shadow-sm text-center">
          <h2 className="text-xl font-bold">
            {day.title}
          </h2>

          <p className="mt-3 text-gray-500">
            No exercises have been added to this workout yet.
          </p>
        </div>

        {!session.completed && (
          <CompleteWorkoutButton
            onClick={() => {
              completeWorkout();
              window.location.href = "/";
            }}
          />
        )}

        {session.completed && (
          <div className="rounded-3xl bg-green-50 p-5 text-center font-bold text-green-700">
            ✅ Today's workout completed
          </div>
        )}
      </div>
    );
  }

  const totalSets = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets,
    0
  );

  return (
    <div className="space-y-6 p-5">
      <WorkoutHeader
        title={workout.title}
        day={day.title}
      />

      <WorkoutSummary
        exercises={workout.exercises.length}
        sets={totalSets}
      />

      <div className="space-y-4">
        {workout.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
          />
        ))}
      </div>

      {!session.completed && (
        <CompleteWorkoutButton
          onClick={() => {
            completeWorkout();
            window.location.href = "/";
          }}
        />
      )}

      {session.completed && (
        <div className="rounded-3xl bg-green-50 p-5 text-center font-bold text-green-700">
          ✅ Today's workout completed
        </div>
      )}
    </div>
  );
}

export default WorkoutPage;