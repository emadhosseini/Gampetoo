type WorkoutHeaderProps = {
  title: string;
  day: string;
};

export default function WorkoutHeader({
  title,
  day,
}: WorkoutHeaderProps) {
  return (
    <div className="mb-6">
      <p className="text-sm text-gray-500">{day}</p>

      <h1 className="mt-1 text-3xl font-bold">
        {title}
      </h1>
    </div>
  );
}