import ModalOverlay from "@/components/ModalOverlay";
import WorkoutSummary from "@/components/WorkoutSummary";

export interface WorkoutCompleteModalProps {
  open: boolean;
  workoutTitle: string;
  exercises: number;
  sets: number;
  // Cancelling doesn't just close the modal — the slide button behind it
  // needs to reset back to its start position too (the caller does this,
  // typically by remounting SlideToCompleteButton via a changing key).
  onCancel: () => void;
  onConfirm: () => void;
}

export default function WorkoutCompleteModal({
  open,
  workoutTitle,
  exercises,
  sets,
  onCancel,
  onConfirm,
}: WorkoutCompleteModalProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalOverlay onClose={onCancel}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">{workoutTitle}</h2>

        <p className="text-sm text-white/70">خلاصه تمرین امروز</p>

        <WorkoutSummary exercises={exercises} sets={sets} />

        <button
          onClick={onConfirm}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white"
        >
          تایید
        </button>

        <button
          onClick={onCancel}
          className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
        >
          انصراف
        </button>
      </div>
    </ModalOverlay>
  );
}
