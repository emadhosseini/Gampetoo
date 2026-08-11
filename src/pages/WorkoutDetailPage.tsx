import { ChevronDown, Minus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import Toggle from "@/components/Toggle";
import ModalOverlay from "@/components/ModalOverlay";
import { getWorkout, saveWorkoutExercises } from "@/store/workoutLibraryStore";
import {
  getSpecializedWarmup,
  saveWarmupGroups,
} from "@/store/warmupLibraryStore";
import {
  createVariant,
  deleteVariant,
  getVariants,
  renameVariant,
  updateVariantGroups,
} from "@/store/workoutVariantStore";

import type { Exercise, ExerciseGroup } from "@/data/workoutLibrary";
import type { WarmupGroup } from "@/data/warmupLibrary";
import { matchesWordPrefix, normalizeFa } from "@/utils/persianSearch";
import { toFaDigits } from "@/utils/numberFormat";
import { generateId } from "@/utils/id";

// The library-workout tab's key in `drafts` below — every real plan is
// keyed by its own id already, so this just needs to not collide with one
// of those (a generated id never comes out as this literal string).
const DEFAULT_KEY = "default";

// A single text-input popup, reused for both "save as a new plan" (asks
// for a name up front) and "rename this plan" (pre-filled with its current
// name) — same shape, just a different title/placeholder/initial value.
function VariantNameModal({
  open,
  title,
  initialName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initialName: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);

  if (!open) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">{title}</h2>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثلاً پوش B"
          autoFocus
          className="glass-chip w-full rounded-xl p-4 text-center text-white placeholder:text-white/40 outline-none"
        />

        <button
          onClick={() => {
            if (!name.trim()) return;
            onSubmit(name.trim());
          }}
          disabled={!name.trim()}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          ذخیره
        </button>

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

// The toggle-plus-steppers block a single exercise is edited with — shared
// between the normal per-group list and the search results below, so a
// found exercise is edited with literally the same control it would be
// edited with inside its own group, not a second copy that could drift
// from it.
function ExerciseEditRow({
  exercise,
  isWarmupWorkout,
  onUpdate,
}: {
  exercise: Exercise;
  isWarmupWorkout: boolean;
  onUpdate: (patch: Partial<Exercise>) => void;
}) {
  return (
    <div className="glass-chip glass-static rounded-xl p-4">
      <div
        className={`flex items-center gap-3 ${isWarmupWorkout ? "" : "mb-4"}`}
      >
        <Toggle
          checked={exercise.enabled}
          onChange={() => onUpdate({ enabled: !exercise.enabled })}
        />

        <span className="flex-1 font-medium">{exercise.name}</span>
      </div>

      {!isWarmupWorkout && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-2 text-sm font-medium text-white">ست</div>

            <div className="selector-pill flex items-center justify-between rounded-xl p-2">
              <button
                onClick={() => {
                  if (exercise.sets <= 1) return;

                  onUpdate({ sets: exercise.sets - 1 });
                }}
              >
                <Minus size={18} />
              </button>

              <span className="font-bold text-white">{toFaDigits(exercise.sets)}</span>

              <button onClick={() => onUpdate({ sets: exercise.sets + 1 })}>
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-white">
              {exercise.unit === "seconds" ? "ثانیه" : "تکرار"}
            </div>

            <div className="selector-pill flex items-center justify-between rounded-xl p-2">
              <button
                onClick={() => {
                  const step = exercise.unit === "seconds" ? 5 : 1;

                  if (exercise.reps <= step) return;

                  onUpdate({ reps: exercise.reps - step });
                }}
              >
                <Minus size={18} />
              </button>

              <span className="font-bold text-white">{toFaDigits(exercise.reps)}</span>

              <button
                onClick={() =>
                  onUpdate({
                    reps: exercise.reps + (exercise.unit === "seconds" ? 5 : 1),
                  })
                }
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkoutDetailPage() {
  const { id } = useParams();

  const workout = id ? getWorkout(id) : undefined;
  const specializedWarmup = id ? getSpecializedWarmup(id) : undefined;

  const [warmupGroups, setWarmupGroups] = useState<WarmupGroup[]>(
    () => specializedWarmup?.groups ?? [],
  );

  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const [warmupSectionOpen, setWarmupSectionOpen] = useState(false);

  const [saved, setSaved] = useState(false);

  const [query, setQuery] = useState("");

  // Which of this workout's saved plans (workoutVariantStore) is currently
  // being viewed/edited — null means the library's own base workout
  // (برنامه پیش‌فرض). Bumping variantVersion forces a fresh getVariants()
  // read after create/rename/delete, the same "no reactive store" pattern
  // the rest of this app already uses.
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantVersion, setVariantVersion] = useState(0);
  const [nameModal, setNameModal] = useState<"create" | "rename" | null>(null);

  // A plan created via "+" but not saved yet — exists only in this page's
  // own state (drafts below) until handleSave actually persists it with a
  // real id via createVariant. Lets a brand-new plan be built up over
  // several tab switches without writing a half-finished one to storage.
  const [pendingVariants, setPendingVariants] = useState<
    { id: string; name: string }[]
  >([]);

  // Every plan's exercises as edited on screen, keyed by DEFAULT_KEY or a
  // (real or pending) variant id — populated lazily, the first time a tab
  // is actually edited (see updateExercise). Switching tabs never touches
  // this: every plan's edits sit here, untouched, for as long as this page
  // stays mounted, and handleSave writes every key present here back to
  // storage in one go — leaving this page without saving (a real
  // navigation away) is what actually discards it, simply because it's
  // plain component state and nothing more.
  const [drafts, setDrafts] = useState<Record<string, ExerciseGroup[]>>({});
  // Specialized-warmup edits live in `warmupGroups` above, not `drafts`
  // (warmup isn't per-plan) — tracked separately so it still counts toward
  // `dirty` below instead of a warmup-only change hiding the save pill.
  const [warmupDirty, setWarmupDirty] = useState(false);

  const variants = useMemo(
    () => (id ? getVariants(id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, variantVersion],
  );

  const currentKey = editingVariantId ?? DEFAULT_KEY;

  // A brand-new plan starts with every exercise off and default sets/reps
  // — never a copy of whatever happened to be checked on the tab the user
  // was looking at, so building "پوش B" always starts from a clean slate.
  function blankGroupsFromBase(): ExerciseGroup[] {
    return (workout?.groups ?? []).map((group) => ({
      ...group,
      exercises: group.exercises.map((exercise) => ({
        ...exercise,
        enabled: false,
      })),
    }));
  }

  function sourceGroupsFor(key: string): ExerciseGroup[] {
    if (key === DEFAULT_KEY) return workout?.groups ?? [];

    return (
      variants.find((v) => v.id === key)?.groups ??
      (pendingVariants.some((p) => p.id === key) ? blankGroupsFromBase() : [])
    );
  }

  const groups = drafts[currentKey] ?? sourceGroupsFor(currentKey);
  // Whether ANY plan has an unsaved edit right now, not just the one on
  // screen — handleSave writes every one of them, so the floating pill
  // (and the bottom button's label) reflect that same scope rather than
  // only the currently-open tab.
  const dirty = warmupDirty || Object.keys(drafts).length > 0;

  const editingVariantName = editingVariantId
    ? (variants.find((v) => v.id === editingVariantId)?.name ??
      pendingVariants.find((p) => p.id === editingVariantId)?.name ??
      null)
    : null;

  // Flattened across every group rather than searched per-group, since the
  // whole point is finding a move without knowing (or opening) which group
  // it's filed under first — that's the actual friction this replaces, on
  // a page like Push where "سینه"/"شانه"/"پشت بازو" each hide their own
  // exercises behind a collapsed header.
  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeFa(query);

    if (!normalizedQuery) return [];

    return groups.flatMap((group) =>
      group.exercises
        .filter((exercise) =>
          matchesWordPrefix(normalizeFa(exercise.name), normalizedQuery),
        )
        .map((exercise) => ({ group, exercise })),
    );
  }, [groups, query]);

  if (!workout) {
    return (
      <div className="py-10 text-center">
        تمرین پیدا نشد.
      </div>
    );
  }

  function toggleWarmupGroup(groupId: string) {
    setSaved(false);
    setWarmupDirty(true);

    setWarmupGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : { ...group, enabled: !group.enabled },
      ),
    );
  }

  function updateExercise(
    groupId: string,
    exerciseId: string,
    patch: Partial<ExerciseGroup["exercises"][number]>,
  ) {
    setSaved(false);

    setDrafts((prev) => {
      const base = prev[currentKey] ?? sourceGroupsFor(currentKey);

      return {
        ...prev,
        [currentKey]: base.map((group) =>
          group.id !== groupId
            ? group
            : {
                ...group,
                exercises: group.exercises.map((exercise) =>
                  exercise.id !== exerciseId
                    ? exercise
                    : { ...exercise, ...patch },
                ),
              },
        ),
      };
    });
  }

  // Writes every plan that has an unsaved draft — not just the one on
  // screen — so switching tabs before saving never quietly loses an edit
  // made to a different plan earlier in the same visit. A pending
  // (not-yet-real) plan is actually created here for the first time, via
  // its draft; idMap lets the tab the user is currently looking at follow
  // it from its temporary id to the real one it gets once persisted.
  function handleSave() {
    if (DEFAULT_KEY in drafts) {
      saveWorkoutExercises(workout!.id, drafts[DEFAULT_KEY]);
    }

    for (const variant of variants) {
      if (variant.id in drafts) {
        updateVariantGroups(variant.id, drafts[variant.id]);
      }
    }

    const idMap: Record<string, string> = {};

    for (const pending of pendingVariants) {
      const created = createVariant(workout!.id, pending.name, drafts[pending.id] ?? []);

      idMap[pending.id] = created.id;
    }

    if (specializedWarmup) {
      saveWarmupGroups(specializedWarmup.workoutType, warmupGroups);
    }

    setPendingVariants([]);
    setDrafts({});
    setWarmupDirty(false);
    setVariantVersion((v) => v + 1);

    if (editingVariantId && idMap[editingVariantId]) {
      setEditingVariantId(idMap[editingVariantId]);
    }

    setSaved(true);
  }

  // Just changes which plan is on screen — every plan's edits already live
  // in `drafts`, untouched by this, so there's nothing to discard or
  // confirm here any more.
  function switchTo(variantId: string | null) {
    setEditingVariantId(variantId);
    setSaved(false);
  }

  // Doesn't touch storage — see pendingVariants above. Starts blank
  // (blankGroupsFromBase), not a copy of whatever tab was open, so a new
  // plan is always built up from scratch.
  function handleCreateVariant(name: string) {
    const tempId = generateId();

    setPendingVariants((prev) => [...prev, { id: tempId, name }]);
    setDrafts((prev) => ({ ...prev, [tempId]: blankGroupsFromBase() }));
    setEditingVariantId(tempId);
    setNameModal(null);
    setSaved(false);
  }

  function handleRenameVariant(name: string) {
    if (!editingVariantId) return;

    if (pendingVariants.some((p) => p.id === editingVariantId)) {
      setPendingVariants((prev) =>
        prev.map((p) => (p.id === editingVariantId ? { ...p, name } : p)),
      );
    } else {
      renameVariant(editingVariantId, name);
      setVariantVersion((v) => v + 1);
    }

    setNameModal(null);
  }

  function handleDeleteVariant() {
    if (!editingVariantId) return;

    const isPending = pendingVariants.some((p) => p.id === editingVariantId);

    if (!isPending && !window.confirm("این پلن حذف بشه؟ این کار قابل بازگشت نیست.")) {
      return;
    }

    if (isPending) {
      setPendingVariants((prev) => prev.filter((p) => p.id !== editingVariantId));
    } else {
      deleteVariant(editingVariantId);
      setVariantVersion((v) => v + 1);
    }

    setDrafts((prev) => {
      const next = { ...prev };

      delete next[editingVariantId!];

      return next;
    });

    switchTo(null);
  }

  const isWarmupWorkout = workout.id === "warmup";
  // Only the workouts a program day can actually be assigned to (see
  // ProgramBuilderPage/WorkoutPickerModal) benefit from multiple plans —
  // گرم کردن عمومی has no plan concept of its own, and an empty workout has
  // no exercises yet to clone into a first plan anyway.
  const supportsVariants = !isWarmupWorkout && (workout.groups?.length ?? 0) > 0;

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      {/* Small floating pill, not the full-size button — only appears once
          there's actually something unsaved (dirty), sitting up top-left
          so a change made after scrolling down doesn't need a trip all
          the way back to the bottom button just to save it. Sticky rather
          than fixed: MobileContainer's phone-shaped frame is narrower than
          the real viewport on desktop, and fixed positions relative to the
          viewport, not that frame. */}
      {dirty && (groups.length > 0 || specializedWarmup) && (
        <div className="sticky top-2 z-30 flex justify-end">
          <button
            onClick={handleSave}
            className="glass-action rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg"
          >
            ذخیره
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold">
        {workout.title}
        {editingVariantName && (
          <span className="mr-2 text-lg font-normal text-white/60">
            — {editingVariantName}
          </span>
        )}
      </h1>

      {/* Multiple saved plans for this same workout (e.g. "پوش A"/"پوش B")
          — برنامه پیش‌فرض is always the library's own base workout and
          can't be renamed/deleted; anything else here is a
          workoutVariantStore entry (or, until the next save, a pending one
          that only exists in this page's own state — see pendingVariants).
          A new one always starts blank (blankGroupsFromBase), never a copy
          of whatever tab was open. ProgramBuilderPage lets a program day
          be assigned more than one of these, and WorkoutPage asks which to
          do once the day arrives. */}
      {supportsVariants && (
        <div className="space-y-2">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => switchTo(null)}
              className={`glass-chip glass-static shrink-0 rounded-full px-4 py-2 text-sm font-medium text-white ${
                !editingVariantId ? "glass-chip-selected" : ""
              }`}
            >
              برنامه پیش‌فرض
            </button>

            {[...variants, ...pendingVariants].map((variant) => (
              <button
                key={variant.id}
                onClick={() => switchTo(variant.id)}
                className={`glass-chip glass-static shrink-0 rounded-full px-4 py-2 text-sm font-medium text-white ${
                  editingVariantId === variant.id ? "glass-chip-selected" : ""
                }`}
              >
                {variant.name}
              </button>
            ))}

            <button
              onClick={() => setNameModal("create")}
              aria-label="ذخیره به عنوان پلن جدید"
              className="glass-action flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
            >
              <Plus size={16} />
            </button>
          </div>

          {editingVariantName && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setNameModal("rename")}
                className="glass-tap glass-static flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-white/70"
              >
                <Pencil size={12} />
                تغییر نام
              </button>

              <button
                onClick={handleDeleteVariant}
                className="glass-tap glass-static flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-red-400"
              >
                <Trash2 size={12} />
                حذف این پلن
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {/* Above everything else on the page, including گرم کردن تخصصی —
            finding a move shouldn't depend on knowing which collapsed
            section it's filed under, or scrolling past the warmup block to
            get there. Editing a result uses the exact same control as the
            group list below (ExerciseEditRow), so there's nothing extra to
            learn once something's found. */}
        {groups.length > 0 && (
          <div className="glass-panel glass-static rounded-2xl p-4">
            <div className="glass-chip flex items-center gap-2 rounded-xl p-2">
              <Search size={16} className="shrink-0 text-white/60" />

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی حرکت..."
                className="w-full bg-transparent px-1 py-2 text-sm text-white placeholder:text-white/50 outline-none"
              />
            </div>

            {query.trim() && (
              <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="py-2 text-center text-sm text-white/60">
                    حرکتی پیدا نشد.
                  </p>
                ) : (
                  searchResults.map(({ group, exercise }) => (
                    <div key={exercise.id}>
                      <p className="mb-1 px-1 text-xs text-white/50">
                        {group.title}
                      </p>

                      <ExerciseEditRow
                        exercise={exercise}
                        isWarmupWorkout={isWarmupWorkout}
                        onUpdate={(patch) =>
                          updateExercise(group.id, exercise.id, patch)
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {specializedWarmup && (
          <div className="glass-panel glass-static rounded-2xl p-4">
            <button
              onClick={() => setWarmupSectionOpen((prev) => !prev)}
              className="flex w-full items-center justify-between"
            >
              <h2 className="text-lg font-semibold">
                گرم کردن تخصصی
              </h2>

              <ChevronDown
                className={`h-5 w-5 text-zinc-200 transition-transform ${
                  warmupSectionOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {warmupSectionOpen && (
              <div className="mt-4 space-y-3">
                {warmupGroups.map((group) => (
                  <div
                    key={group.id}
                    className="glass-chip glass-static rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={group.enabled}
                        onChange={() => toggleWarmupGroup(group.id)}
                      />

                      <span className="flex-1 font-medium">
                        {group.title}
                      </span>
                    </div>

                    {group.enabled && (
                      <ul className="mt-3 space-y-2">
                        {group.exercises.map((exercise) => (
                          <li
                            key={exercise.id}
                            className="glass-chip rounded-lg px-3 py-2 text-sm"
                          >
                            {exercise.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {groups.length === 0 && (
          <div className="glass-panel rounded-2xl p-6 text-center">
            <p className="text-white">
              حرکتی برای این تمرین هنوز اضافه نشده — به‌زودی اضافه می‌شه.
            </p>
          </div>
        )}

        {groups.map((group) => {
          const isOpen = openGroupId === group.id;

          return (
            <div
              key={group.id}
              className="glass-panel glass-static rounded-2xl p-4"
            >
              <button
                onClick={() =>
                  setOpenGroupId(isOpen ? null : group.id)
                }
                className="flex w-full items-center justify-between"
              >
                <h2 className="text-lg font-semibold">
                  {group.title}
                </h2>

                <ChevronDown
                  className={`h-5 w-5 text-zinc-200 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-4 space-y-4">
                  {/* Enabled (checked) exercises float to the top of their
                      group — a stable sort, so ties (same enabled state)
                      keep the library's own order instead of jumping
                      around as unrelated exercises get toggled. */}
                  {[...group.exercises]
                    .sort((a, b) => Number(b.enabled) - Number(a.enabled))
                    .map((exercise) => (
                      <ExerciseEditRow
                        key={exercise.id}
                        exercise={exercise}
                        isWarmupWorkout={isWarmupWorkout}
                        onUpdate={(patch) =>
                          updateExercise(group.id, exercise.id, patch)
                        }
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(groups.length > 0 || specializedWarmup) && (
        <button
          onClick={handleSave}
          className="w-full glass-action rounded-2xl py-4 text-lg font-bold text-white"
        >
          {saved ? "ذخیره شد ✅" : "ذخیره"}
        </button>
      )}

      {/* Keyed so each open starts from a fresh initialName — this
          component holds its own input state internally, which would
          otherwise stay stuck on whatever it was the first time it
          mounted (e.g. rename reused across different plans). */}
      <VariantNameModal
        key={`create-${nameModal === "create"}`}
        open={nameModal === "create"}
        title="نام پلن جدید"
        initialName=""
        onClose={() => setNameModal(null)}
        onSubmit={handleCreateVariant}
      />

      <VariantNameModal
        key={`rename-${editingVariantId}-${nameModal === "rename"}`}
        open={nameModal === "rename"}
        title="تغییر نام پلن"
        initialName={editingVariantName ?? ""}
        onClose={() => setNameModal(null)}
        onSubmit={handleRenameVariant}
      />
    </div>
  );
}
