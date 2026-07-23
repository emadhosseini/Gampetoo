import SlideToCompleteButton from "@/components/SlideToCompleteButton";

type CompleteWorkoutButtonProps = {
  onClick: () => void;
  label?: string;
  variant?: "primary" | "accent";
};

export default function CompleteWorkoutButton({
  onClick,
  label = "اتمام تمرین",
  variant = "primary",
}: CompleteWorkoutButtonProps) {
  if (variant === "accent") {
    return <SlideToCompleteButton label={label} onComplete={onClick} />;
  }

  return (
    <button
      onClick={onClick}
      className="mt-6 w-full rounded-2xl bg-forest-900 py-4 text-lg font-semibold text-white"
    >
      {label}
    </button>
  );
}