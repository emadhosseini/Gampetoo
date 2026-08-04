import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import WorkoutTaxonomyGrid from "@/components/WorkoutTaxonomyGrid";
import {
  findTaxonomyNode,
  pruneToSelectable,
  workoutTaxonomy,
  type WorkoutTaxonomyNode,
} from "@/data/workoutTaxonomy";
import { getWorkout } from "@/store/workoutLibraryStore";

export interface WorkoutPickerModalProps {
  open: boolean;
  onClose: () => void;
  // null means "استراحت / پیاده‌روی" (rest day) was picked.
  onPick: (workoutId: string | null) => void;
}

function hasContent(workoutId: string): boolean {
  return (getWorkout(workoutId)?.groups.length ?? 0) > 0;
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

  const selectableRoot = pruneToSelectable(workoutTaxonomy, hasContent);
  const node = path.length === 0 ? null : findTaxonomyNode(path);
  const nodes =
    path.length === 0
      ? selectableRoot
      : node?.kind === "branch"
        ? pruneToSelectable(node.children, hasContent)
        : [];
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

        {path.length === 0 && (
          <button
            onClick={() => {
              onPick(null);
              onClose();
            }}
            className="glass-tap selector-pill w-full rounded-2xl py-3 font-bold text-white"
          >
            استراحت / پیاده‌روی
          </button>
        )}

        <WorkoutTaxonomyGrid nodes={nodes} onSelect={handleSelect} />

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
