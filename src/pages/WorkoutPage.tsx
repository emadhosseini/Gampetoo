import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

import WorkoutHeader from "@/components/WorkoutHeader";
import WeeklyScheduleModal from "@/components/WeeklyScheduleModal";
import ModalOverlay from "@/components/ModalOverlay";
import WorkoutSummary from "@/components/WorkoutSummary";
import WorkoutCompleteModal from "@/components/WorkoutCompleteModal";
import WalkCompleteModal from "@/components/WalkCompleteModal";
import ExerciseCard from "@/components/ExerciseCard";
import CompleteWorkoutButton from "@/components/CompleteWorkoutButton";
import WarmupBlock from "@/components/WarmupBlock";
import SpecializedWarmupBlock from "@/components/SpecializedWarmupBlock";

import {
  getCurrentProgramDay,
  getCurrentWorkoutType,
  hasProgramStarted,
} from "@/utils/programEngine";

import { getWorkout } from "@/store/workoutLibraryStore";
import {
  DEFAULT_VARIANT_ID,
  getVariant,
  getWorkoutWithVariant,
} from "@/store/workoutVariantStore";
import { getSpecializedWarmup } from "@/store/warmupLibraryStore";
import {
  applyExerciseOrder,
  getExerciseOrder,
  setExerciseOrder,
} from "@/store/workoutOrderStore";
import { walkCharacterIcon } from "@/data/characterIcons";
import type { Exercise } from "@/data/workoutLibrary";

import {
  getSession,
  completeWorkout,
  completeWalk,
  toggleExerciseChecked,
  estimateCheckedWorkoutCalories,
  setSelectedVariantId,
} from "@/utils/sessionEngine";
import { setTodayWorkoutCalories } from "@/utils/workoutCalorieEngine";
import { logActivityCalories } from "@/utils/activityLogEngine";
import { getCurrentUserGender, getCurrentUsername } from "@/utils/userEngine";
import { flushPendingSync } from "@/sync/remoteSync";

// Completing used to navigate home right after this, which is why it was
// needed in the first place: a full page navigation tears down the JS
// context before the sync engine's debounced push would otherwise fire.
// Staying on this page removes that race — the debounce still fires on its
// own — but the flush is kept anyway so the completed status reaches the
// server right away rather than waiting out the debounce regardless.
async function flushAfterCompleting() {
  const username = getCurrentUsername();

  if (username) {
    await flushPendingSync(username);
  }
}

function WorkoutPage() {
  const navigate = useNavigate();

  // resetKey is bumped to remount SlideToCompleteButton (snapping its
  // handle back to the start) when the confirm popup is cancelled — the
  // button itself has no "go back to start" API, so a fresh mount is the
  // simplest way to force it.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  // Whether the confirm popup's burned-calorie estimate should land in the
  // day's activity total. Defaults on — that's what the app did before the
  // choice existed — and deliberately isn't reset when the popup is
  // cancelled and reopened, so a user who turned it off doesn't have to
  // turn it off again.
  const [addCaloriesToActivity, setAddCaloriesToActivity] = useState(true);
  // getSession() reads straight from localStorage on every call rather than
  // being held in React state — bumping this after each checkbox tap is
  // what actually triggers the re-render that picks the fresh value up.
  const [, forceRerender] = useState(0);

  // The rest day's own slide-to-complete confirmation — mirrors
  // resetKey/confirmOpen above, same remount-to-reset trick for the
  // slider on cancel.
  const [walkConfirmOpen, setWalkConfirmOpen] = useState(false);
  const [walkResetKey, setWalkResetKey] = useState(0);

  // Manual reorder mode for today's exercise list, toggled by the pencil
  // button below the list. `reorderList` is a working copy edited with the
  // up/down buttons and only written back to workoutOrderStore on save —
  // cancelling just discards it.
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<Exercise[]>([]);
  // The pencil icon in WorkoutHeader opens this choice between the two
  // things there are to edit here — today's exercise order (reorder mode,
  // below) or the workout's own exercises/sets (its library page).
  const [editChoiceOpen, setEditChoiceOpen] = useState(false);

  // Shared between WarmupBlock and SpecializedWarmupBlock — tapping either
  // one's header opens both lists together, side by side, rather than each
  // card toggling only its own.
  const [warmupOpen, setWarmupOpen] = useState(false);

  function moveReorderItem(index: number, direction: -1 | 1) {
    setReorderList((prev) => {
      const target = index + direction;

      if (target < 0 || target >= prev.length) return prev;

      const next = [...prev];

      [next[index], next[target]] = [next[target], next[index]];

      return next;
    });
  }

  function finishWalk(calories: number | null) {
    setWalkConfirmOpen(false);

    if (calories !== null) {
      logActivityCalories(calories);
    }

    completeWalk();
    void flushAfterCompleting();
    // getSession() re-reads localStorage on every render but nothing
    // schedules a render on its own — this is what actually surfaces the
    // "تمرین امروز رو انجام دادی" state in place, now that finishing
    // doesn't navigate away to reveal it a different way.
    forceRerender((n) => n + 1);
  }

  const session = getSession();

  // Read fresh each render rather than held anywhere, matching HomePage's
  // own hero icon — so a gender change on the profile page shows up here
  // the next time this renders too, not just on the home screen.
  const gender = getCurrentUserGender();

  function handleToggleExercise(exercise: Exercise) {
    toggleExerciseChecked(exercise.id);
    forceRerender((n) => n + 1);
  }

  const day = getCurrentProgramDay();

 const workoutType = getCurrentWorkoutType();

  // Which of this day's assigned plans (ProgramBuilderPage's "چند حالت
  // برنامه") to actually show today — see sessionEngine's
  // selectedVariantId. Fewer than 2 assigned plans never need a choice:
  // empty/undefined behaves exactly like before this existed (the base
  // workout), and exactly one entry is used straight away with no prompt.
  const assignedVariantIds = day.assignedVariantIds ?? [];
  const needsVariantChoice = assignedVariantIds.length > 1;
  const resolvedVariantId = needsVariantChoice
    ? session.selectedVariantId
    : (assignedVariantIds[0] ?? null);

const workout = workoutType
  ? getWorkoutWithVariant(workoutType, resolvedVariantId)
  : undefined;

  // Only a real (non-default) pick gets a label — پیش‌فرض reads as noise
  // next to a workout title that already says what it is.
  const resolvedVariantName =
    resolvedVariantId && resolvedVariantId !== DEFAULT_VARIANT_ID
      ? getVariant(resolvedVariantId)?.name
      : undefined;

  const isWorkout = day.activity === "workout";

  const warmupExercises = (
    getWorkout("warmup")?.groups?.flatMap(
      (group) => group.exercises ?? []
    ) ?? []
  ).filter((exercise) => exercise.enabled);

  const specializedWarmup = workoutType
    ? getSpecializedWarmup(workoutType)
    : undefined;

  const enabledSpecializedWarmupGroups = (
    specializedWarmup?.groups ?? []
  ).filter((group) => group.enabled);

  if (!hasProgramStarted()) {
    return (
      <div className="px-5 pb-5 pt-4">
        <div className="glass-panel glass-static rounded-3xl p-6 text-center">
          <p className="text-xl font-bold text-white">
            امروز تمرینی نداری
          </p>
        </div>
      </div>
    );
  }

  // A workout day with 2+ assigned plans and nothing picked yet blocks the
  // exercise list until one is chosen — asked once (see setSelectedVariantId,
  // which sticks for the rest of today).
  if (isWorkout && needsVariantChoice && resolvedVariantId === null) {
    return (
      <div className="space-y-4 px-5 pb-5 pt-4 text-center">
        <WorkoutHeader
          title={day.title}
          showForgotButton
          inlineActions={<WeeklyScheduleModal />}
        />

        <p className="text-white">امروز کدوم برنامه رو می‌خوای انجام بدی؟</p>

        <div className="space-y-2">
          {assignedVariantIds.map((variantId) => {
            const label =
              variantId === DEFAULT_VARIANT_ID
                ? "برنامه پیش‌فرض"
                : (getVariant(variantId)?.name ?? "برنامه پیش‌فرض");

            return (
              <button
                key={variantId}
                onClick={() => {
                  setSelectedVariantId(variantId);
                  forceRerender((n) => n + 1);
                }}
                className="glass-tap selector-pill w-full rounded-2xl py-4 font-bold text-white"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!isWorkout) {
    return (
      <div className="space-y-6 px-5 pb-5 pt-4">
        <WorkoutHeader
          title="روز استراحت"
          showForgotButton
          inlineActions={<WeeklyScheduleModal />}
        />

        <div className="glass-panel glass-static rounded-3xl p-6 text-center">
          {/* Same male/female walking illustration HomePage's hero card
              already uses for a rest day (walkCharacterIcon) — not a
              generic rest/bed icon, since the day's actual ask is the
              walk, and this way the two screens draw it identically. */}
          <img
            src={walkCharacterIcon(gender)}
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            className="mx-auto h-24 w-24 object-contain"
          />

          <p className="mt-3 text-sm text-white">
            استراحت و پیاده روی سبک به مدت ۴۵ تا ۶۰ دقیقه
          </p>
        </div>

        {!session.completed && (
          <CompleteWorkoutButton
            key={walkResetKey}
            variant="accent"
            label="پیاده روی امروز رو انجام دادم 💪🏻"
            onClick={() => setWalkConfirmOpen(true)}
          />
        )}

        {session.completed && (
          <div className="glass-panel glass-static mt-6 rounded-full py-4 text-center text-lg font-semibold text-white">
            تمرین امروز رو انجام دادی☺️
          </div>
        )}

        <WalkCompleteModal
          open={walkConfirmOpen}
          onCancel={() => {
            setWalkConfirmOpen(false);
            setWalkResetKey((key) => key + 1);
          }}
          onConfirm={finishWalk}
        />
      </div>
    );
  }

  const exercises = (
    workout?.groups?.flatMap(
      (group) => group.exercises ?? []
    ) ?? []
  ).filter((exercise) => exercise.enabled);

  if (!workout || exercises.length === 0) {
    return (
      <div className="space-y-6 px-5 pb-5 pt-4">
        <WorkoutHeader
          title={day.title}
          showForgotButton
          inlineActions={<WeeklyScheduleModal />}
        />

        <div className="glass-panel glass-static rounded-3xl p-2 text-center">

          <p className="m-3 text-white">
            برای این تمرین هنوز حرکتی انتخاب نشده.
            {/* <h2>در کتابخانه تمرین ها حرکت های مورد نظر خود را انتخاب کنید</h2> */}
          </p>
        </div>

        {!session.completed && (
          <CompleteWorkoutButton
            label="رفتن به کتابخانه تمرین‌ها"
            onClick={() => {
              navigate(
                workoutType
                  ? `/settings/workouts/${workoutType}`
                  : "/settings/workouts"
              );
            }}
          />
        )}

        {session.completed && (
          <div className="glass-panel glass-static mt-6 rounded-full py-4 text-center text-lg font-semibold text-white">
            تمرین امروز رو انجام دادی ☺️
          </div>
        )}
      </div>
    );
  }

  // Derived from the checklist on every render rather than accumulated as
  // exercises are ticked, so it always matches what's actually checked off
  // right now. Nothing has been written anywhere yet at this point — that
  // only happens if the user confirms with the toggle on.
  const checkedCalories = estimateCheckedWorkoutCalories(
    exercises,
    session.checkedExercises,
  );

  // The summary (both the confirm popup and the post-completion card)
  // reports what was actually checked off, not every exercise the workout
  // has on offer — same idea as checkedCalories above, which already only
  // ever counted checked exercises; the exercise/set counts here used to
  // report the workout's full list regardless of what got ticked.
  const checkedExercisesForSummary = exercises.filter((exercise) =>
    session.checkedExercises.includes(exercise.id),
  );
  const summaryExerciseCount = checkedExercisesForSummary.length;
  const summarySets = checkedExercisesForSummary.reduce(
    (sum, exercise) => sum + exercise.sets,
    0,
  );

  // The user's own manually-saved order (if any) takes priority over the
  // exercises' natural group order — everything downstream (the checklist
  // and the reorder screen itself) builds on top of this.
  const orderedExercises = applyExerciseOrder(
    exercises,
    workoutType ? getExerciseOrder(workoutType) : undefined,
  );

  const checkedExerciseIds = new Set(session.checkedExercises);
  // A stable sort just sinks checked-off exercises to the bottom, keeping
  // both groups in their original relative order — no re-shuffling within
  // "still to do" or "already done" as you check more of them off.
  const sortedExercises = [...orderedExercises].sort(
    (a, b) =>
      Number(checkedExerciseIds.has(a.id)) - Number(checkedExerciseIds.has(b.id)),
  );

  function startReorder() {
    setReorderList(orderedExercises);
    setReorderMode(true);
  }

  function saveReorder() {
    if (workoutType) {
      setExerciseOrder(
        workoutType,
        reorderList.map((exercise) => exercise.id),
      );
    }

    setReorderMode(false);
  }

  return (
    <div className="space-y-6 px-5 pb-5 pt-4">
      <WorkoutHeader
        title={workout.title}
        belowTitle={resolvedVariantName}
        showForgotButton
        onEditWorkout={() => setEditChoiceOpen(true)}
        inlineActions={<WeeklyScheduleModal />}
      />

      <div
        className={`grid gap-3 ${specializedWarmup ? "grid-cols-2" : "grid-cols-1"}`}
      >
        <WarmupBlock
          exercises={warmupExercises}
          compact
          open={warmupOpen}
          onToggle={() => setWarmupOpen((prev) => !prev)}
        />

        {specializedWarmup && (
          <SpecializedWarmupBlock
            title={`🎯 ${specializedWarmup.title}`}
            groups={enabledSpecializedWarmupGroups}
            compact
            open={warmupOpen}
            onToggle={() => setWarmupOpen((prev) => !prev)}
          />
        )}
      </div>

      {!reorderMode && (
        <div className="space-y-4">
          {sortedExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              checked={checkedExerciseIds.has(exercise.id)}
              onToggleChecked={() => handleToggleExercise(exercise)}
            />
          ))}
        </div>
      )}

      {/* Manual reorder mode — up/down buttons instead of drag-and-drop,
          since there's no such control on this page, and moving an item a
          few rows takes just as many taps either way. Only touches the
          user's saved order, not the checklist itself. */}
      {reorderMode && (
        <div className="space-y-2">
          {reorderList.map((exercise, index) => (
            <div
              key={exercise.id}
              className="glass-chip glass-static flex items-center gap-3 rounded-xl p-3"
            >
              <span className="flex-1 text-sm font-medium text-white">
                {exercise.name}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveReorderItem(index, -1)}
                  disabled={index === 0}
                  className="glass-chip glass-static rounded-lg p-2 text-white disabled:opacity-30"
                >
                  <ChevronUp size={16} />
                </button>

                <button
                  onClick={() => moveReorderItem(index, 1)}
                  disabled={index === reorderList.length - 1}
                  className="glass-chip glass-static rounded-lg p-2 text-white disabled:opacity-30"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reorderMode && (
        <div className="flex gap-3">
          <button
            onClick={() => setReorderMode(false)}
            className="glass-chip glass-static flex-1 rounded-2xl py-3 text-sm font-medium text-white"
          >
            انصراف
          </button>

          <button
            onClick={saveReorder}
            className="glass-action glass-action-static flex-1 rounded-2xl py-3 text-sm font-bold text-white"
          >
            ذخیره ترتیب
          </button>
        </div>
      )}

      {!session.completed && !reorderMode && (
        <CompleteWorkoutButton
          key={resetKey}
          variant="accent"
          label="تمرین امروز رو انجام دادم 💪🏻"
          onClick={() => setConfirmOpen(true)}
        />
      )}

      {/* The exercise/set counts only show up here now, once the workout is
          actually done — not while it's still in progress above the list,
          where they were just noise repeating what the checklist itself
          already shows. */}
      {session.completed && (
        <div className="glass-panel glass-static mt-6 space-y-3 rounded-3xl p-5 text-center">
          <p className="text-lg font-semibold text-white">
            تمرین امروز رو انجام دادی☺️
          </p>

          <p className="text-sm text-white/70">خلاصه تمرین امروز</p>

          <WorkoutSummary exercises={summaryExerciseCount} sets={summarySets} />
        </div>
      )}

      <WorkoutCompleteModal
        open={confirmOpen}
        workoutTitle={workout.title}
        exercises={summaryExerciseCount}
        sets={summarySets}
        calories={checkedCalories}
        addToActivity={addCaloriesToActivity}
        onToggleAddToActivity={() => setAddCaloriesToActivity((on) => !on)}
        onCancel={() => {
          setConfirmOpen(false);
          setResetKey((key) => key + 1);
        }}
        onConfirm={() => {
          setConfirmOpen(false);
          // The only path that ever writes the day's workout-calorie total.
          // Written unconditionally so turning the toggle off is an explicit
          // zero rather than leaving whatever happened to be there — and it
          // sets rather than adds, so confirming twice in a day can't double
          // it (see workoutCalorieEngine).
          setTodayWorkoutCalories(addCaloriesToActivity ? checkedCalories : 0);
          completeWorkout();
          void flushAfterCompleting();
          // Same reason as finishWalk: nothing else schedules a re-render,
          // and this is what actually shows the "انجام دادی" summary in
          // place now that confirming stays on this page.
          forceRerender((n) => n + 1);
        }}
      />

      {editChoiceOpen && (
        <ModalOverlay onClose={() => setEditChoiceOpen(false)}>
          <div className="glass-panel glass-static space-y-3 rounded-3xl p-6 text-center">
            <h2 className="text-lg font-bold text-white">ویرایش تمرین امروز</h2>

            <button
              onClick={() => {
                setEditChoiceOpen(false);
                startReorder();
              }}
              className="w-full glass-action glass-action-static rounded-2xl py-3 font-bold text-white"
            >
              تغییر ترتیب
            </button>

            <button
              onClick={() => {
                setEditChoiceOpen(false);

                if (workoutType) {
                  navigate(`/settings/workouts/${workoutType}`);
                }
              }}
              className="glass-tap glass-static selector-pill w-full rounded-2xl py-3 font-bold text-white"
            >
              تغییر تمرین‌ها و ست‌ها
            </button>

            {/* Only when this day actually has more than one assigned
                plan (see ProgramBuilderPage's "چند حالت برنامه") — a day
                with just the one plan has nothing to switch between.
                Clearing the day's pick and re-rendering is what puts the
                page back on the same چند-حالت chooser screen it showed
                the first time this day came up. */}
            {needsVariantChoice && (
              <button
                onClick={() => {
                  setEditChoiceOpen(false);
                  setSelectedVariantId(null);
                  forceRerender((n) => n + 1);
                }}
                className="glass-tap glass-static selector-pill w-full rounded-2xl py-3 font-bold text-white"
              >
                تغییر پلن امروز
              </button>
            )}

            <button
              onClick={() => setEditChoiceOpen(false)}
              className="ghost-action ghost-action-static w-full rounded-2xl py-3 font-medium text-white"
            >
              بستن
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

export default WorkoutPage;