import { useState } from "react";
import { StickyNote } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import { getExerciseNote, setExerciseNote } from "@/store/exerciseNoteStore";

export interface ExerciseNoteButtonProps {
  // See exerciseNoteStore: a note belongs to one specific plan, never to
  // the exercise everywhere it's used — variantId is workoutVariantStore's
  // DEFAULT_VARIANT_ID for the base plan, exactly what every caller already
  // has on hand as either an explicit variant id or that constant.
  workoutId: string;
  variantId: string;
  exerciseId: string;
  exerciseName: string;
}

// Read fresh on every render rather than held in state — same pattern as
// the rest of this app's localStorage-backed screens (see CLAUDE.md): no
// subscription layer exists, so the button's own filled/empty look and the
// modal's prefilled text both come straight from storage each time.
export default function ExerciseNoteButton({
  workoutId,
  variantId,
  exerciseId,
  exerciseName,
}: ExerciseNoteButtonProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const note = getExerciseNote(workoutId, variantId, exerciseId);

  function openModal() {
    setDraft(note);
    setOpen(true);
  }

  function save() {
    setExerciseNote(workoutId, variantId, exerciseId, draft);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label={note ? "ویرایش یادداشت این حرکت در این پلن" : "افزودن یادداشت برای این حرکت در این پلن"}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          note
            ? "bg-avocado-yellow/20 text-avocado-yellow"
            : "glass-chip glass-static text-white"
        }`}
      >
        <StickyNote size={14} />
      </button>

      {open && (
        <ModalOverlay onClose={() => setOpen(false)}>
          <div className="glass-panel glass-static space-y-4 rounded-3xl p-6">
            <div className="text-center">
              <h2 className="text-base font-bold text-white">{exerciseName}</h2>
              <p className="mt-1 text-xs text-white/50">
                این یادداشت فقط توی همین پلن نشون داده می‌شه
              </p>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="مثلاً: این حرکت رو با دست بسته انجام بده"
              rows={4}
              autoFocus
              className="glass-chip w-full resize-none rounded-2xl p-4 text-sm text-white placeholder:text-white/40 outline-none"
            />

            <button
              onClick={save}
              className="w-full glass-action rounded-2xl py-3 font-bold text-white"
            >
              ذخیره
            </button>

            <button
              onClick={() => setOpen(false)}
              className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
            >
              بستن
            </button>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}
