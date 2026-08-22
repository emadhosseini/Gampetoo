import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Toggle from "@/components/Toggle";
import ExerciseSetLogger from "@/components/ExerciseSetLogger";
import { confirmAllSets } from "@/utils/exerciseSetLogEngine";
import type { Exercise } from "@/data/workoutLibrary";

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
      className={`glass-panel glass-static rounded-2xl p-2.5 transition-opacity ${
        checked ? "opacity-50" : ""
      }`}
    >
      {/* Collapsed row is deliberately just the name and the toggle now —
          the configured sets/reps count used to show here too, but that
          number is what seeds today's actual set rows below instead (see
          ExerciseSetLogger's defaultSets/defaultReps), so showing it twice
          was redundant with the drawer this row opens. Height matches
          WeeklyScheduleModal's own "تقویم هفته" button (same py-2.5 on a
          text-sm row) so every exercise reads as one compact line until
          it's actually opened. */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="flex-1 text-right"
        >
          <h2 className="text-sm font-bold text-white">
            {exercise.name}
            {exercise.nameEn && (
              <span className="ms-1.5 text-[10px] font-normal text-white/40">
                {exercise.nameEn}
              </span>
            )}
          </h2>
        </button>

        <Toggle checked={checked} onChange={handleToggleChecked} />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            // -mx-1/px-1: without this, every rounded-xl/rounded-full chip
            // inside the drawer below (set rows, PR chip, history rows...)
            // sits flush against this overflow-hidden edge — tighter now
            // that the collapsed row's own padding shrank from p-4 to
            // p-2.5 — and renders visibly flattened instead of rounded.
            // Same fix as WeeklyScheduleModal's list.
            className="-mx-1 overflow-hidden px-1"
          >
            <ExerciseSetLogger
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              unit={exercise.unit}
              defaultSets={exercise.sets}
              defaultReps={exercise.reps}
              repsPerSet={exercise.repsPerSet}
              description={exercise.description}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
