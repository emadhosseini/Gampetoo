import type { Exercise } from "@/data/workoutLibrary";

type ExerciseCardProps = {
  exercise: Exercise;
};

export default function ExerciseCard({
  exercise,
}: ExerciseCardProps) {
  return (
    <div className="rounded-3xl bg-zinc-900 p-4">
      <h2 className="text-lg font-bold text-white">
        {exercise.name}
      </h2>

      <div className="mt-2 flex justify-between text-sm text-zinc-400">
        <span>{exercise.sets} ست</span>
        <span>{exercise.reps} تکرار</span>
      </div>
    </div>
  );
}