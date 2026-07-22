import type { Exercise } from "@/data/workoutLibrary";

type ExerciseCardProps = {
  exercise: Exercise;
};

export default function ExerciseCard({
  exercise,
}: ExerciseCardProps) {
  return (
    <div className="glass-panel rounded-3xl p-4">
      <h2 className="text-lg font-bold text-white">
        {exercise.name}
      </h2>

      <div className="mt-2 flex justify-between text-sm text-zinc-200">
        <span>{exercise.sets} ست</span>
        <span>{exercise.reps} تکرار</span>
      </div>
    </div>
  );
}