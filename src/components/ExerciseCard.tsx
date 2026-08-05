import { motion } from "framer-motion";

import Toggle from "@/components/Toggle";
import type { Exercise } from "@/data/workoutLibrary";
import { toFaDigits } from "@/utils/numberFormat";

type ExerciseCardProps = {
  exercise: Exercise;
  checked: boolean;
  onToggleChecked: () => void;
};

export default function ExerciseCard({
  exercise,
  checked,
  onToggleChecked,
}: ExerciseCardProps) {
  return (
    // `layout` animates the position shift when checking this off moves it
    // past its still-to-do siblings in the parent's sorted list — a plain
    // re-render would otherwise just snap it straight to the bottom.
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={`glass-panel flex items-center gap-4 rounded-3xl p-4 transition-opacity ${
        checked ? "opacity-50" : ""
      }`}
    >
      <div className="flex-1">
        <h2 className="text-lg font-bold text-white">
          {exercise.name}
        </h2>

        <div className="mt-2 flex justify-between text-sm text-white">
          <span>{toFaDigits(exercise.sets)} ست</span>
          <span>{toFaDigits(exercise.reps)} تکرار</span>
        </div>
      </div>

      <Toggle checked={checked} onChange={onToggleChecked} />
    </motion.div>
  );
}
