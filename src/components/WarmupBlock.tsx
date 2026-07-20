import { ChevronDown } from "lucide-react";
import { useState } from "react";

type WarmupBlockExercise = {
  id: string;
  name: string;
};

type WarmupBlockProps = {
  exercises: WarmupBlockExercise[];
  title?: string;
};

export default function WarmupBlock({
  exercises,
  title = "🔥 گرم کردن عمومی",
}: WarmupBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (exercises.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-navy-700 p-4">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between"
      >
        <span className="text-lg font-bold text-white">
          {title}
        </span>

        <ChevronDown
          className={`h-5 w-5 text-zinc-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <ul className="mt-4 space-y-2">
          {exercises.map((exercise) => (
            <li
              key={exercise.id}
              className="rounded-xl bg-navy-600/60 px-4 py-3 text-sm text-zinc-100"
            >
              {exercise.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
