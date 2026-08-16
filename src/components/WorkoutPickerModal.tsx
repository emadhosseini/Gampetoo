import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  findTaxonomyNode,
  hasSelectableContent,
  workoutTaxonomy,
  type WorkoutTaxonomyNode,
} from "@/data/workoutTaxonomy";
import { getWorkout } from "@/store/workoutLibraryStore";

export interface WorkoutPickerModalProps {
  open: boolean;
  onClose: () => void;
  // null means "استراحت" (rest day) was picked.
  onPick: (workoutId: string | null) => void;
}

function hasContent(workoutId: string): boolean {
  return (getWorkout(workoutId)?.groups.length ?? 0) > 0;
}

interface PickerCardProps {
  icon: string;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}

// Every card in this picker, real taxonomy node or the synthetic "rest day"
// option alike — nothing here is ever hidden. A card with nothing behind
// it yet (no exercises anywhere inside it) still shows, just blurred and
// labeled, so the full shape of the library is always visible even before
// it's fully populated.
function PickerCard({ icon, title, disabled, onClick }: PickerCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      // Wide and short, matching the day cards on the calendar this opens
      // from — a square tile made every option as tall as the longest one
      // and pushed the list off screen.
      className="glass-panel glass-static relative flex items-center gap-2 overflow-hidden rounded-2xl p-3 text-right"
    >
      <span className="shrink-0 text-xl">{icon}</span>
      <span className="min-w-0 flex-1 text-xs leading-snug font-semibold text-white">
        {title}
      </span>

      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/25 p-2 backdrop-blur-md">
          <p className="text-xs font-medium text-white">
            فعلاً تمرینی برای این وجود نداره
          </p>
        </div>
      )}
    </button>
  );
}

// Assigning a program day's workout now browses the exact same category
// tree the workout library itself uses (see WorkoutLibraryPage/
// WorkoutCategoryPage) — this is a modal rather than a route so the day
// being edited doesn't have to round-trip through a page navigation (the
// program builder's in-progress edits live in local component state, not
// yet saved). Its own `path` is reset every time it opens, exactly
// mirroring how WorkoutCategoryPage reads its splat route from scratch on
// every navigation.
export default function WorkoutPickerModal({
  open,
  onClose,
  onPick,
}: WorkoutPickerModalProps) {
  const [path, setPath] = useState<string[]>([]);

  useEffect(() => {
    if (open) setPath([]);
  }, [open]);

  if (!open) {
    return null;
  }

  const node = path.length === 0 ? null : findTaxonomyNode(path);
  const nodes = path.length === 0 ? workoutTaxonomy : (node?.kind === "branch" ? node.children : []);
  const title = path.length === 0 ? "انتخاب برنامه تمرینی" : (node?.title ?? "");

  function handleSelect(child: WorkoutTaxonomyNode) {
    if (child.kind === "branch") {
      setPath([...path, child.id]);
    } else {
      onPick(child.workoutId);
      onClose();
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[80vh] space-y-4 overflow-y-auto rounded-3xl p-6">
        <div className="relative flex items-center justify-center">
          {path.length > 0 && (
            <button
              onClick={() => setPath((prev) => prev.slice(0, -1))}
              aria-label="بازگشت"
              className="glass-chip absolute right-0 flex h-9 w-9 items-center justify-center rounded-full"
            >
              <ChevronRight size={18} />
            </button>
          )}

          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {path.length === 0 && (
            <PickerCard
              icon="🚶"
              title="استراحت"
              onClick={() => {
                onPick(null);
                onClose();
              }}
            />
          )}

          {nodes.map((child) => (
            <PickerCard
              key={child.id}
              icon={child.icon}
              title={child.title}
              disabled={!hasSelectableContent(child, hasContent)}
              onClick={() => handleSelect(child)}
            />
          ))}
        </div>

        <button
          onClick={onClose}
          className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
        >
          بستن
        </button>
      </div>
    </ModalOverlay>
  );
}
