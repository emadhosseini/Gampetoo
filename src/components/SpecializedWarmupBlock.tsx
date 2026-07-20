import { ChevronDown } from "lucide-react";
import { useState } from "react";

type SpecializedWarmupBlockExercise = {
  id: string;
  name: string;
};

type SpecializedWarmupBlockGroup = {
  id: string;
  title: string;
  exercises: SpecializedWarmupBlockExercise[];
};

type SpecializedWarmupBlockProps = {
  title: string;
  groups: SpecializedWarmupBlockGroup[];
};

export default function SpecializedWarmupBlock({
  title,
  groups,
}: SpecializedWarmupBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (groups.length === 0) {
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
        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="mb-2 text-xs font-semibold text-zinc-400">
                {group.title}
              </div>

              <ul className="space-y-2">
                {group.exercises.map((exercise) => (
                  <li
                    key={exercise.id}
                    className="rounded-xl bg-navy-600/60 px-4 py-3 text-sm text-zinc-100"
                  >
                    {exercise.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
