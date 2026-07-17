type CompleteWorkoutButtonProps = {
  onClick: () => void;
};

export default function CompleteWorkoutButton({
  onClick,
}: CompleteWorkoutButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mt-6 w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white"
    >
      اتمام تمرین
    </button>
  );
}