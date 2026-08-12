import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Toggle from "@/components/Toggle";
import ExerciseSetLogger from "@/components/ExerciseSetLogger";
import { confirmAllSets } from "@/utils/exerciseSetLogEngine";
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
  // Tapping anywhere on the card except the toggle opens the set-logging
  // drawer (ExerciseSetLogger) — the toggle's own "done for today" state
  // is unrelated to whether the drawer showing its actual sets is open.
  const [expanded, setExpanded] = useState(false);

  // Marking the exercise done closes its drawer too — any rest timer
  // running inside ExerciseSetLogger stops as soon as it unmounts (its own
  // effect cleanup), so there's nothing left counting down for an exercise
  // that's already finished. Only fires on the way to checked (not when
  // unchecking a mistake), so it never fights a currently-open drawer the
  // user is still actively logging sets in.
  //
  // Also confirms any set that has real numbers typed in but never got its
  // own تایید tap — without this, ticking the exercise done while a set
  // sat there unconfirmed meant that set silently never counted toward the
  // personal record (and so never reached the strength radar), which just
  // read as "the chart didn't update".
  function handleToggleChecked() {
    if (!checked) {
      confirmAllSets(exercise.id);
      setExpanded(false);
    }

    onToggleChecked();
  }

  return (
    // `layout` animates the position shift when checking this off moves it
    // past its still-to-do siblings in the parent's sorted list — a plain
    // re-render would otherwise just snap it straight to the bottom.
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={`glass-panel glass-static rounded-3xl p-4 transition-opacity ${
        checked ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="flex-1 text-right"
        >
          <h2 className="text-lg font-bold text-white">
            {exercise.name}
          </h2>

          <p className="mt-2 text-sm text-white">{toFaDigits(exercise.sets)} ست</p>
        </button>

        {/* Reps/seconds sits under the toggle rather than beside the sets
            count — with the toggle now here, a justify-between row cramming
            both numbers into the name's own column read as cluttered. This
            reads as one unit: what you're marking done, and how much of it. */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <Toggle checked={checked} onChange={handleToggleChecked} />
          <span className="text-xs text-white/60">
            {toFaDigits(exercise.reps)}{" "}
            {exercise.unit === "seconds" ? "ثانیه" : "تکرار"}
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="overflow-hidden"
          >
            <ExerciseSetLogger
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              unit={exercise.unit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
