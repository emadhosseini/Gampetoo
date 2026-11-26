import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  CANONICAL_EXERCISE_GROUPS,
  getLibrary,
  resolveExerciseGroupMeta,
} from "@/store/workoutLibraryStore";
import {
  flattenExercises,
  matchesSearch,
} from "@/domain/services/exerciseService";
import { getBaseExerciseId } from "@/utils/exerciseIdentity";
import { toFaDigits } from "@/utils/numberFormat";
import type { Exercise } from "@/data/workoutLibrary";

export interface ExerciseSearchPickerProps {
  // Ids already in the group/workout being edited — when `allowDuplicates`
  // is false, shown as disabled "اضافه شده"; when true, shows the current
  // occurrence count and still lets the user add another copy with its own note.
  existingIds: string[];
  onPick: (exercise: Exercise) => void;
  label?: string;
  allowDuplicates?: boolean;
}

/**
 * Searches the entire exercise catalogue across all muscle groups (chest,
 * back, shoulders, biceps, triceps, forearms, legs, abs, cardio) so any
 * workout day (e.g. Push) can freely include movements from any other
 * muscle group (e.g. Biceps or Abs).
 */
export default function ExerciseSearchPicker({
  existingIds,
  onPick,
  label = "جست‌وجو از تمرین‌های دیگه",
  allowDuplicates = false,
}: ExerciseSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  // Ids added during this session, so a picked row can show immediate feedback
  // without waiting for a full parent re-render.
  const [justAdded, setJustAdded] = useState<string[]>([]);

  const all = useMemo(() => (open ? flattenExercises(getLibrary()) : []), [open]);

  const results = useMemo(
    () =>
      all.filter((exercise) => {
        if (groupFilter && resolveExerciseGroupMeta(exercise).id !== groupFilter) {
          return false;
        }
        return matchesSearch(exercise, query);
      }),
    [all, groupFilter, query],
  );

  const countByBaseId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of [...existingIds, ...justAdded]) {
      const base = getBaseExerciseId(id);
      counts.set(base, (counts.get(base) ?? 0) + 1);
    }
    return counts;
  }, [existingIds, justAdded]);

  function handlePick(exercise: Exercise) {
    setJustAdded((prev) => [...prev, exercise.id]);
    onPick(exercise);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass-chip glass-static flex w-full items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium text-white"
      >
        <Search size={14} className="text-white/60" />
        {label}
      </button>

      {open && (
        <ModalOverlay
          onClose={() => {
            setOpen(false);
            setQuery("");
            setGroupFilter(null);
            setJustAdded([]);
          }}
        >
          <div className="glass-panel glass-static flex max-h-[85vh] w-full flex-col gap-3 rounded-3xl p-4">
            <h2 className="text-center text-base font-bold text-white">
              {label}
            </h2>

            <div className="glass-chip glass-static flex items-center gap-2 rounded-full px-3 py-2">
              <Search size={16} className="shrink-0 text-white/60" />

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="نام حرکت (فارسی یا انگلیسی)..."
                autoFocus
                className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="پاک کردن"
                  className="shrink-0 text-white/60"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Granular muscle-group chips (سینه، پشت، سرشانه، جلو بازو، پشت بازو، ساعد، پا، شکم، هوازی) */}
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
              {CANONICAL_EXERCISE_GROUPS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setGroupFilter((prev) => (prev === item.id ? null : item.id))
                  }
                  className={`glass-chip glass-static shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-white ${
                    groupFilter === item.id ? "glass-chip-selected" : ""
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div className="-mx-1 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-1">
              {results.length === 0 ? (
                <p className="py-6 text-center text-sm text-white/50">حرکتی پیدا نشد.</p>
              ) : (
                results.map((exercise) => {
                  const count = countByBaseId.get(getBaseExerciseId(exercise.id)) ?? 0;
                  const added = count > 0;
                  const isDisabled = !allowDuplicates && added;
                  const groupTitle = resolveExerciseGroupMeta(exercise).title;

                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handlePick(exercise)}
                      className={`glass-chip glass-static flex w-full items-center gap-2 rounded-2xl p-2.5 text-right ${
                        isDisabled ? "opacity-50" : ""
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                          {exercise.name}
                          {exercise.nameEn && (
                            <span className="ms-1.5 text-[10px] font-normal text-white/40">
                              {exercise.nameEn}
                            </span>
                          )}
                        </span>

                        <span className="block text-[10px] text-white/40">
                          {[
                            groupTitle,
                            exercise.equipment,
                            allowDuplicates && added
                              ? `${toFaDigits(count)} بار اضافه شده`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>

                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          isDisabled
                            ? "bg-avocado-lime/20 text-avocado-lime"
                            : added && allowDuplicates
                              ? "bg-avocado-yellow/20 text-avocado-yellow"
                              : "glass-action glass-action-static text-white"
                        }`}
                      >
                        {isDisabled ? <Check size={14} /> : <Plus size={14} />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setQuery("");
                setGroupFilter(null);
                setJustAdded([]);
              }}
              className="ghost-action ghost-action-static w-full shrink-0 rounded-2xl py-3 font-medium text-white"
            >
              بستن
            </button>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}
