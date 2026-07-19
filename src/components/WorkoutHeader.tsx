type WorkoutHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function WorkoutHeader({
  title,
  subtitle = "برنامه امروز",
}: WorkoutHeaderProps) {
  return (
    <div className="mb-6 mt-4 text-center">
      <p className="text-sm text-zinc-400">{subtitle}</p>

      <h1 className="mt-1 text-3xl font-bold">
        {title}
      </h1>
    </div>
  );
}