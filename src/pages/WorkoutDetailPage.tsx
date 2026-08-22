import { ChevronDown, Minus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Toggle from "@/components/Toggle";
import ModalOverlay from "@/components/ModalOverlay";
import ExerciseSearchPicker from "@/components/ExerciseSearchPicker";
import ExerciseNoteButton from "@/components/ExerciseNoteButton";
import { movePlanNotes } from "@/store/exerciseNoteStore";
import {
  getDefaultPlanName,
  getWorkout,
  addExerciseToGroup,
  saveWorkoutExercises,
  setDefaultPlanName,
} from "@/store/workoutLibraryStore";
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
  workoutId,
  variantId,
  onUpdate,
}: {
  exercise: Exercise;
  isWarmupWorkout: boolean;
  // See exerciseNoteStore — the plan this row belongs to right now, so its
  // note button reads/writes the note for THIS plan specifically, not the
  // exercise everywhere it's used.
  workoutId: string;
  variantId: string;
  onUpdate: (patch: Partial<Exercise>) => void;
}) {
  // Collapsed by default, exactly like the daily workout page's own
  // ExerciseCard — the sets/reps steppers used to always be on screen,
  // which made every row four times as tall as the same exercise looks
  // there. The general گرم کردن library has no sets/reps at all, so its
  // rows never expand (nothing to reveal).
  const [expanded, setExpanded] = useState(false);
  const canExpand = !isWarmupWorkout;
  const repsStep = exercise.unit === "seconds" ? 5 : 1;
  const isPyramid = Boolean(exercise.repsPerSet && exercise.repsPerSet.length > 0);

  // Turning پیرامید on seeds one rep-target per current set (all starting
  // at the same reps count, so switching modes never silently changes what
  // today's log would seed) instead of leaving it empty; turning it off
  // drops the array entirely — {...exercise, ...patch} needs the key
  // present-but-undefined to actually clear a previous value, not just
  // omitted, which is exactly what an explicit `repsPerSet: undefined`
  // patch does.
  function togglePyramid() {
    onUpdate(
      isPyramid
        ? { repsPerSet: undefined }
        : { repsPerSet: Array.from({ length: exercise.sets }, () => exercise.reps) },
    );
  }

  function updateRepAt(index: number, value: number) {
    const next = [...(exercise.repsPerSet ?? [])];

    next[index] = Math.max(1, value);

    onUpdate({ repsPerSet: next });
  }

  // Changing the set count while پیرامید is on keeps the array the same
  // length as `sets` — extending repeats the last set's own target rather
  // than defaulting back to the flat `reps` value, shrinking just drops the
  // trailing set(s).
  function updateSetCount(nextSets: number) {
    if (nextSets < 1) return;

    const patch: Partial<Exercise> = { sets: nextSets };

    if (exercise.repsPerSet) {
      patch.repsPerSet =
        nextSets > exercise.repsPerSet.length
          ? [
              ...exercise.repsPerSet,
              ...Array.from(
                { length: nextSets - exercise.repsPerSet.length },
                () => exercise.repsPerSet![exercise.repsPerSet!.length - 1],
              ),
            ]
          : exercise.repsPerSet.slice(0, nextSets);
    }

    onUpdate(patch);
  }

  return (
    // Same shell as ExerciseCard: glass-panel + rounded-2xl + p-2.5, a
    // single text-sm row, toggle on the end.
    <div className="glass-panel glass-static rounded-2xl p-2.5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => canExpand && setExpanded((prev) => !prev)}
          aria-expanded={canExpand ? expanded : undefined}
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

        {!isWarmupWorkout && (
          <ExerciseNoteButton
            workoutId={workoutId}
            variantId={variantId}
            exerciseId={exercise.id}
            exerciseName={exercise.name}
          />
        )}

        <Toggle
          checked={exercise.enabled}
          onChange={() => onUpdate({ enabled: !exercise.enabled })}
        />
      </div>

      <AnimatePresence initial={false}>
        {canExpand && expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            // -mx-1/px-1 for the same reason ExerciseCard's own drawer has
            // it: the rounded steppers inside would otherwise render
            // flattened against this overflow-hidden edge.
            className="-mx-1 overflow-hidden px-1"
          >
            <div className="mt-2.5 grid grid-cols-2 gap-3 border-t border-white/10 pt-2.5">
              <div>
                <div className="mb-1.5 text-xs font-medium text-white/60">ست</div>

                <div className="selector-pill flex items-center justify-between rounded-xl p-1.5">
                  <button
                    onClick={() => updateSetCount(exercise.sets - 1)}
                    aria-label="کم کردن ست"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="text-sm font-bold text-white">
                    {toFaDigits(exercise.sets)}
                  </span>

                  <button
                    onClick={() => updateSetCount(exercise.sets + 1)}
                    aria-label="زیاد کردن ست"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {!isPyramid && (
                <div>
                  <div className="mb-1.5 text-xs font-medium text-white/60">
                    {exercise.unit === "seconds" ? "ثانیه" : "تکرار"}
                  </div>

                  <div className="selector-pill flex items-center justify-between rounded-xl p-1.5">
                    <button
                      onClick={() => {
                        if (exercise.reps <= repsStep) return;

                        onUpdate({ reps: exercise.reps - repsStep });
                      }}
                      aria-label="کم کردن تکرار"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="text-sm font-bold text-white">
                      {toFaDigits(exercise.reps)}
                    </span>

                    <button
                      onClick={() => onUpdate({ reps: exercise.reps + repsStep })}
                      aria-label="زیاد کردن تکرار"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Off by default (see Exercise.repsPerSet) — most exercises
                really do use the same rep count on every set, so this stays
                a single opt-in switch rather than always showing a row of
                steppers nobody asked for. */}
            {exercise.unit !== "seconds" && (
              <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5">
                <span className="text-xs font-medium text-white/60">
                  تکرار متغیر برای هر ست (هرمی)
                </span>

                <Toggle checked={isPyramid} onChange={togglePyramid} />
              </div>
            )}

            {isPyramid && (
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {exercise.repsPerSet!.map((rep, index) => (
                  <div key={index}>
                    <div className="mb-1 text-center text-[10px] text-white/50">
                      ست {toFaDigits(index + 1)}
                    </div>

                    <div className="selector-pill flex items-center justify-between rounded-lg p-1">
                      <button
                        onClick={() => updateRepAt(index, rep - 1)}
                        aria-label={`کم کردن تکرار ست ${toFaDigits(index + 1)}`}
                      >
                        <Minus size={12} />
                      </button>

                      <span className="text-xs font-bold text-white">{toFaDigits(rep)}</span>

                      <button
                        onClick={() => updateRepAt(index, rep + 1)}
                        aria-label={`زیاد کردن تکرار ست ${toFaDigits(index + 1)}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// One specialized-warmup group (تحرک مفصلی and the like) — same compact
// shell as ExerciseEditRow above and the daily page's ExerciseCard: a
// single text-sm row with its toggle, tapping the title expanding to the
// moves it actually contains. Its own component purely so each row owns
// its own `expanded` state.
function WarmupGroupRow({
  group,
  onToggle,
}: {
  group: WarmupGroup;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-panel glass-static rounded-2xl p-2.5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="flex-1 text-right"
        >
          <h2 className="text-sm font-bold text-white">{group.title}</h2>
        </button>

        <Toggle checked={group.enabled} onChange={onToggle} />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="-mx-1 overflow-hidden px-1"
          >
            <ul className="mt-2.5 space-y-1.5 border-t border-white/10 pt-2.5">
              {group.exercises.map((exercise) => (
                <li
                  key={exercise.id}
                  className="glass-chip glass-static rounded-lg px-3 py-2 text-sm text-white"
                >
                  {exercise.name}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
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
  // Whether the تغییر‌نام/حذف drawer under the selected plan's own pencil
  // icon is open — separate from `editingVariantId` (which just decides
  // which plan's exercises are on screen): tapping a pill selects it
  // without opening anything, tapping its pencil specifically is what
  // reveals this.
  const [renameDrawerOpen, setRenameDrawerOpen] = useState(false);
  // "برنامه پیش‌فرض"'s own label, per workout — not a workoutVariantStore
  // entry (it's the library's own base workout), so it's a small separate
  // override (see workoutLibraryStore.getDefaultPlanName) rather than
  // living alongside variants/pendingVariants below.
  const [defaultNameVersion, setDefaultNameVersion] = useState(0);

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

  const defaultPlanName = useMemo(
    () => (id ? getDefaultPlanName(id) : "برنامه پیش‌فرض"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, defaultNameVersion],
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
        .filter(
          (exercise) =>
            matchesWordPrefix(normalizeFa(exercise.name), normalizedQuery) ||
            matchesWordPrefix(normalizeFa(exercise.nameEn ?? ""), normalizedQuery),
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

  // Pulls an exercise in from elsewhere in the catalogue (see
  // ExerciseSearchPicker). It lands in the draft straight away so it shows
  // up in the list immediately, enabled — nobody searches out a movement
  // in order to leave it switched off. Where it's persisted depends on the
  // plan: a variant stores its whole group list wholesale
  // (updateVariantGroups), while the base library workout has no such
  // list, so the addition is recorded separately by id (addExerciseToGroup)
  // and re-applied by getLibrary on the next read.
  function handleAddExercise(groupId: string, exercise: Exercise) {
    setSaved(false);

    setDrafts((prev) => {
      const base = prev[currentKey] ?? sourceGroupsFor(currentKey);

      return {
        ...prev,
        [currentKey]: base.map((group) =>
          group.id !== groupId ||
          group.exercises.some((existing) => existing.id === exercise.id)
            ? group
            : {
                ...group,
                exercises: [...group.exercises, { ...exercise, enabled: true }],
              },
        ),
      };
    });

    if (currentKey === DEFAULT_KEY) {
      addExerciseToGroup(workout!.id, groupId, exercise.id);
    }
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
      // Any note jotted down before this plan had a real id (see
      // ExerciseNoteButton) was saved under the temp one — move it over now
      // or it's unreachable the moment pendingVariants below is cleared.
      movePlanNotes(workout!.id, pending.id, created.id);
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
    setRenameDrawerOpen(false);
    setSaved(false);
  }

  // The pencil on a pill (variantId null means برنامه پیش‌فرض): selects
  // that plan (same as tapping the pill itself would) and toggles its own
  // drawer — tapping the pencil on an already-selected plan just opens/
  // closes the drawer without touching selection again.
  function togglePencil(variantId: string | null) {
    if (editingVariantId === variantId) {
      setRenameDrawerOpen((prev) => !prev);
    } else {
      setEditingVariantId(variantId);
      setRenameDrawerOpen(true);
      setSaved(false);
    }
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
    if (!editingVariantId) {
      // برنامه پیش‌فرض isn't a workoutVariantStore entry — its label is a
      // small separate override (see workoutLibraryStore.setDefaultPlanName).
      setDefaultPlanName(workout!.id, name);
      setDefaultNameVersion((v) => v + 1);
      setNameModal(null);

      return;
    }

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
    <div className="space-y-6 px-5 pb-5 pt-2">
      {/* Title and the "ذخیره" pill share one sticky row now instead of
          the title sitting on its own further down — centered title, save
          button pinned to one side (only rendered once there's actually
          something unsaved), the whole row staying on screen while
          scrolling so a change made further down never needs a trip back
          up just to save it. Sticky rather than fixed: MobileContainer's
          phone-shaped frame is narrower than the real viewport on desktop,
          and fixed positions relative to the viewport, not that frame. */}
      <div className="sticky top-2 z-30 flex items-center justify-center">
        <h1 className="text-2xl font-bold">تمرین {workout.title}</h1>

        {dirty && (groups.length > 0 || specializedWarmup) && (
          <button
            onClick={handleSave}
            className="glass-action absolute inset-e-0 rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg"
          >
            ذخیره
          </button>
        )}
      </div>

      {/* Multiple saved plans for this same workout (e.g. "پوش A"/"پوش B")
          — برنامه پیش‌فرض is the library's own base workout, so its own
          label is a small separate override (see workoutLibraryStore's
          getDefaultPlanName/setDefaultPlanName) rather than a
          workoutVariantStore entry, and it can't be deleted; everything
          else here is a real variant (or, until the next save, a pending
          one that only exists in this page's own state — see
          pendingVariants). A new one always starts blank
          (blankGroupsFromBase), never a copy of whatever tab was open.
          ProgramBuilderPage lets a program day be assigned more than one of
          these, and WorkoutPage asks which to do once the day arrives.
          One continuous glass-panel wraps the pill row and its rename/
          delete drawer, so opening a pencil reads as this same card
          growing rather than a second, separately-bordered box appearing
          underneath it (same recipe as ExerciseCard's own expand). Every
          plan pill is `flex-1` (equal width, however many there are)
          instead of sized to its own text — with just برنامه پیش‌فرض on
          screen, it alone fills all the room "+" doesn't take. */}
      {supportsVariants && (
        // No wrapping card of its own — the pills and "+" sit directly on
        // the page, and the rename/delete drawer opens beneath them the
        // same way (also with no panel behind it).
        <div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => switchTo(null)}
              className={`glass-chip glass-static flex min-w-0 flex-1 items-center justify-between gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white ${
                !editingVariantId ? "glass-chip-selected" : ""
              }`}
            >
              {/* flex-1 text-center on the span, not the button: the
                  pencil (shrink-0, justify-between) stays pinned at the
                  pill's own far end while just the label centers itself
                  within whatever space is left beside it. */}
              <span className="min-w-0 flex-1 truncate text-center">{defaultPlanName}</span>
              <Pencil
                size={12}
                className="shrink-0 text-white/50"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePencil(null);
                }}
              />
            </button>

            {[...variants, ...pendingVariants].map((variant) => (
              <button
                key={variant.id}
                onClick={() => switchTo(variant.id)}
                className={`glass-chip glass-static flex min-w-0 flex-1 items-center justify-between gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white ${
                  editingVariantId === variant.id ? "glass-chip-selected" : ""
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-center">{variant.name}</span>
                <Pencil
                  size={12}
                  className="shrink-0 text-white/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePencil(variant.id);
                  }}
                />
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

          <AnimatePresence initial={false}>
            {renameDrawerOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="overflow-hidden"
              >
                {/* Each action gets its own chip — same rounded-full shape,
                    gap and padding as the plan pills above, so the two rows
                    line up as one system rather than the drawer reading as
                    two bare labels. */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <button
                    onClick={() => setNameModal("rename")}
                    className="glass-chip glass-static flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-white"
                  >
                    <Pencil size={12} />
                    تغییر نام
                  </button>

                  {/* برنامه پیش‌فرض can't be deleted — it's the library's
                      own base workout, not a real variant. */}
                  {editingVariantId && (
                    <button
                      onClick={handleDeleteVariant}
                      className="glass-chip glass-static flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-red-400"
                    >
                      <Trash2 size={12} />
                      حذف این پلن
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
          // Like the plan-variants row above it: no wrapping card, just the
          // input itself — same rounded-full pill shape and padding as the
          // plan pills, so the two rows read as siblings.
          <div>
            <div className="glass-chip glass-static flex items-center gap-2 rounded-full px-3 py-2">
              <Search size={16} className="shrink-0 text-white/60" />

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی حرکت..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
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
                        workoutId={workout!.id}
                        variantId={currentKey}
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
                  <WarmupGroupRow
                    key={group.id}
                    group={group}
                    onToggle={() => toggleWarmupGroup(group.id)}
                  />
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
                        workoutId={workout!.id}
                        variantId={currentKey}
                        onUpdate={(patch) =>
                          updateExercise(group.id, exercise.id, patch)
                        }
                      />
                    ))}

                  {/* Anything in the catalogue, not just what this day was
                      seeded with — see ExerciseSearchPicker. */}
                  <ExerciseSearchPicker
                    existingIds={group.exercises.map((exercise) => exercise.id)}
                    onPick={(exercise) => handleAddExercise(group.id, exercise)}
                  />
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
        initialName={editingVariantId ? (editingVariantName ?? "") : defaultPlanName}
        onClose={() => setNameModal(null)}
        onSubmit={handleRenameVariant}
      />
    </div>
  );
}
