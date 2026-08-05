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
    return <SlideToCompleteButton label={label} onReachEnd={onClick} />;
  }

  return (
    <button
      onClick={onClick}
      className="mt-6 glass-action w-full rounded-2xl py-4 text-lg font-semibold text-white"
    >
      {label}
    </button>
  );
}