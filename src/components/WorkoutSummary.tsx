type WorkoutSummaryProps = {
  exercises: number;
  sets: number;
};

export default function WorkoutSummary({
  exercises,
  sets,
}: WorkoutSummaryProps) {
  return (
    <div className="rounded-3xl bg-black p-5 text-white">
      <div className="flex justify-between">
        <div>
          <p className="text-sm opacity-70">حرکت</p>
          <p className="mt-1 text-2xl font-bold">{exercises}</p>
        </div>

        <div>
          <p className="text-sm opacity-70">ست</p>
          <p className="mt-1 text-2xl font-bold">{sets}</p>
        </div>
      </div>
    </div>
  );
}