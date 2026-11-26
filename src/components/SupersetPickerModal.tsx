import { useMemo, useState } from "react";
import { Check, Link2, Plus, Search, Unlink2, X, Zap } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  CANONICAL_EXERCISE_GROUPS,
  getLibrary,
  resolveExerciseGroupMeta,
} from "@/store/workoutLibraryStore";
import { getExerciseNote } from "@/store/exerciseNoteStore";
import { flattenExercises, matchesSearch } from "@/domain/services/exerciseService";
import type { Exercise } from "@/data/workoutLibrary";

export interface SupersetPickerModalProps {
  open: boolean;
  sourceExercise: Exercise | null;
  /** Other enabled exercises in this workout plan that can be paired directly. */
  planExercises: Exercise[];
  workoutId: string;
  variantId: string;
  onClose: () => void;
  /** Pair `sourceExercise` with an existing exercise already in the plan. */
  onPairExisting: (targetExerciseId: string) => void;
  /** Add a brand-new exercise from the catalogue and pair it with `sourceExercise`. */
  onPairFromCatalogue: (catalogueExercise: Exercise) => void;
  /** Unlink `sourceExercise` (or a specific partner) from its superset group. */
  onUnlink: (exerciseId: string) => void;
}

/**
 * Lets the user link an exercise into a superset with either:
 *   1) another enabled exercise already in this workout plan, or
 *   2) any movement from the full exercise catalogue (added & paired in one tap).
 */
export default function SupersetPickerModal({
  open,
  sourceExercise,
  planExercises,
  workoutId,
  variantId,
  onClose,
  onPairExisting,
  onPairFromCatalogue,
  onUnlink,
}: SupersetPickerModalProps) {
  const [tab, setTab] = useState<"plan" | "catalogue">("plan");
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const allCatalogue = useMemo(
    () => (open ? flattenExercises(getLibrary()) : []),
    [open],
  );

  const currentPartners = useMemo(() => {
    if (!sourceExercise?.supersetGroupId) return [];
    return planExercises.filter(
      (ex) =>
        ex.id !== sourceExercise.id &&
        ex.supersetGroupId === sourceExercise.supersetGroupId,
    );
  }, [planExercises, sourceExercise]);

  const otherPlanExercises = useMemo(() => {
    if (!sourceExercise) return [];
    return planExercises.filter(
      (ex) =>
        ex.id !== sourceExercise.id &&
        (!sourceExercise.supersetGroupId ||
          ex.supersetGroupId !== sourceExercise.supersetGroupId) &&
        matchesSearch(ex, query),
    );
  }, [planExercises, query, sourceExercise]);

  const catalogueResults = useMemo(
    () =>
      allCatalogue.filter((exercise) => {
        if (groupFilter && resolveExerciseGroupMeta(exercise).id !== groupFilter) {
          return false;
        }
        return matchesSearch(exercise, query);
      }),
    [allCatalogue, groupFilter, query],
  );

  if (!open || !sourceExercise) return null;

  function handleClose() {
    setQuery("");
    setGroupFilter(null);
    setTab("plan");
    onClose();
  }

  return (
    <ModalOverlay onClose={handleClose}>
      <div className="glass-panel glass-static flex max-h-[85vh] w-full flex-col gap-3 rounded-3xl p-4">
        <div className="text-center">
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-avocado-yellow/15 px-3 py-1 text-xs font-bold text-avocado-yellow">
            <Zap size={13} />
            سوپرست
          </div>
          <h2 className="text-base font-bold text-white">{sourceExercise.name}</h2>
          <p className="mt-0.5 text-xs text-white/55">
            حرکتی که می‌خوای با این حرکت سوپرست بشه انتخاب کن
          </p>
        </div>

        {/* Currently linked partners */}
        {currentPartners.length > 0 && (
          <div className="space-y-1.5 rounded-2xl border border-avocado-yellow/25 bg-avocado-yellow/8 p-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-avocado-yellow">
                متصل در این سوپرست:
              </span>
              <button
                type="button"
                onClick={() => {
                  onUnlink(sourceExercise.id);
                  handleClose();
                }}
                className="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-300"
              >
                <Unlink2 size={12} />
                جدا کردن این حرکت
              </button>
            </div>

            {currentPartners.map((partner) => {
              const note = getExerciseNote(workoutId, variantId, partner.id);
              return (
                <div
                  key={partner.id}
                  className="glass-chip glass-static flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                >
                  <div className="min-w-0 flex-1 text-right">
                    <span className="block truncate text-xs font-semibold text-white">
                      {partner.name}
                    </span>
                    {note && (
                      <span className="block truncate text-[10px] text-avocado-yellow/80">
                        {note}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onUnlink(partner.id)}
                    aria-label={`جدا کردن ${partner.name}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-red-300"
                  >
                    <Unlink2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Source tabs: Today's plan vs Full Catalogue */}
        <div className="glass-chip glass-static flex rounded-full p-1">
          <button
            type="button"
            onClick={() => setTab("plan")}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors ${
              tab === "plan" ? "bg-white/18 text-avocado-yellow" : "text-white/65"
            }`}
          >
            حرکات همین روز ({otherPlanExercises.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("catalogue")}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors ${
              tab === "catalogue" ? "bg-white/18 text-avocado-yellow" : "text-white/65"
            }`}
          >
            از کل کتابخانه
          </button>
        </div>

        {/* Search input */}
        <div className="glass-chip glass-static flex items-center gap-2 rounded-full px-3 py-2">
          <Search size={15} className="shrink-0 text-white/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی حرکت..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="پاک کردن"
              className="shrink-0 text-white/60"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {tab === "catalogue" && (
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
        )}

        <div className="-mx-1 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-1">
          {tab === "plan" ? (
            otherPlanExercises.length === 0 ? (
              <div className="space-y-2 py-5 text-center">
                <p className="text-xs text-white/55">
                  حرکت فعال دیگری در این روز برای سوپرست نیست.
                </p>
                <button
                  type="button"
                  onClick={() => setTab("catalogue")}
                  className="glass-action inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-avocado-yellow"
                >
                  <Plus size={14} />
                  انتخاب حرکت جدید از کتابخانه
                </button>
              </div>
            ) : (
              otherPlanExercises.map((ex) => {
                const note = getExerciseNote(workoutId, variantId, ex.id);
                const alreadyInAnotherSuperset = Boolean(ex.supersetGroupId);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      onPairExisting(ex.id);
                      handleClose();
                    }}
                    className="glass-chip glass-static flex w-full items-center gap-2 rounded-2xl p-2.5 text-right"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {ex.name}
                      </span>
                      {note && (
                        <span className="block truncate text-[10px] text-avocado-yellow/80">
                          {note}
                        </span>
                      )}
                      {alreadyInAnotherSuperset && (
                        <span className="block text-[10px] text-white/45">
                          در سوپرست دیگری است (ادغام می‌شود)
                        </span>
                      )}
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full glass-action glass-action-static text-avocado-yellow">
                      <Link2 size={14} />
                    </span>
                  </button>
                );
              })
            )
          ) : catalogueResults.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/50">حرکتی پیدا نشد.</p>
          ) : (
            catalogueResults.map((exercise) => {
              const groupTitle = resolveExerciseGroupMeta(exercise).title;
              const isAlreadyPartner = currentPartners.some(
                (p) => p.id === exercise.id,
              );
              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    onPairFromCatalogue(exercise);
                    handleClose();
                  }}
                  className="glass-chip glass-static flex w-full items-center gap-2 rounded-2xl p-2.5 text-right"
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
                      {[groupTitle, exercise.equipment].filter(Boolean).join(" · ")}
                    </span>
                  </span>

                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      isAlreadyPartner
                        ? "bg-avocado-lime/20 text-avocado-lime"
                        : "glass-action glass-action-static text-avocado-yellow"
                    }`}
                  >
                    {isAlreadyPartner ? <Check size={14} /> : <Plus size={14} />}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="ghost-action ghost-action-static w-full shrink-0 rounded-2xl py-3 font-medium text-white"
        >
          بستن
        </button>
      </div>
    </ModalOverlay>
  );
}
