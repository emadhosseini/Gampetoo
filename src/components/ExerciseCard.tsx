import { type Exercise } from "@/data/programs";

type ExerciseCardProps = {
  exercise: Exercise;
};

export default function ExerciseCard({
  exercise,
}: ExerciseCardProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">
        {exercise.name}
      </h2>

      <div className="mt-4 flex justify-between text-sm text-gray-500">
        <span>{exercise.sets} ست</span>
        <span>{exercise.reps} تکرار</span>
      </div>
    </div>
  );
}