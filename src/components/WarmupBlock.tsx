import { ChevronDown } from "lucide-react";

type WarmupBlockExercise = {
  id: string;
  name: string;
};

type WarmupBlockProps = {
  exercises: WarmupBlockExercise[];
  title?: string;
  // Shrinks padding/title size so this fits next to
  // SpecializedWarmupBlock in a single row on WorkoutPage.
  compact?: boolean;
  // Controlled from WorkoutPage now, shared with SpecializedWarmupBlock's
  // own open state — tapping either card opens both lists side by side,
  // so this isn't each card's own independent toggle anymore.
  open: boolean;
  onToggle: () => void;
};

export default function WarmupBlock({
  exercises,
  title = "🔥 گرم کردن عمومی",
  compact = false,
  open,
  onToggle,
}: WarmupBlockProps) {
  if (exercises.length === 0) {
    return null;
  }

  return (
    <div className={`glass-panel glass-static rounded-3xl ${compact ? "p-3" : "p-4"}`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2"
      >
        <span
          className={`font-bold text-white ${compact ? "text-sm" : "text-lg"}`}
        >
          {title}
        </span>

        <ChevronDown
          className={`shrink-0 text-zinc-200 transition-transform ${
            compact ? "h-4 w-4" : "h-5 w-5"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="mt-4 space-y-2">
          {exercises.map((exercise) => (
            <li
              key={exercise.id}
              className="glass-chip rounded-xl px-4 py-3 text-sm text-white"
            >
              {exercise.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
