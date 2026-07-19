type CompleteWorkoutButtonProps = {
  onClick: () => void;
  label?: string;
  variant?: "primary" | "accent";
};

const variantClasses: Record<
  NonNullable<CompleteWorkoutButtonProps["variant"]>,
  string
> = {
  primary: "bg-black text-white",
  accent: "bg-orange-500 text-black",
};

export default function CompleteWorkoutButton({
  onClick,
  label = "اتمام تمرین",
  variant = "primary",
}: CompleteWorkoutButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`mt-6 w-full rounded-2xl py-4 text-lg font-semibold ${variantClasses[variant]}`}
    >
      {label}
    </button>
  );
}