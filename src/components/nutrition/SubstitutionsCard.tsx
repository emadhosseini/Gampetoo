import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { matchesWordPrefix, normalizeFa } from "@/utils/persianSearch";
import type { FoodSubstitution } from "../../types/nutrition";

interface SubstitutionsCardProps {
  substitutions: FoodSubstitution[];
}

// A group matches when its title or any food in it matches — searching a
// food you're holding ("سینه بوقلمون") is the whole point, and what you
// want back is the group it belongs to, i.e. everything it can be swapped
// for. Word-prefix matching (the same matcher the food/exercise searches
// use), with a plain substring as a fallback so a query landing mid-word of
// an entry like "۱۵۰ گرم سینه بوقلمون" still finds it.
function groupMatches(group: FoodSubstitution, query: string): boolean {
  return [group.title, ...group.foods].some((text) => {
    const name = normalizeFa(text);

    return matchesWordPrefix(name, query) || name.includes(query);
  });
}

export default function SubstitutionsCard({
  substitutions,
}: SubstitutionsCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const normalized = normalizeFa(query);

    if (!normalized) return substitutions;

    return substitutions.filter((group) => groupMatches(group, normalized));
  }, [substitutions, query]);

  return (
    // Same compact-card treatment as MealCard: p-2.5 + text-sm matches
    // WeeklyScheduleModal's "تقویم هفته" button height, glass-static drops
    // the press-scale a plain expand-in-place card shouldn't have.
    <div className="glass-panel glass-static rounded-2xl p-2.5">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="grid w-full grid-cols-[24px_1fr_24px] items-center"
      >
        <span />

        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">🔄</span>

          <h2 className="text-sm font-bold text-white">جایگزین‌های غذایی</h2>
        </span>

        <ChevronDown
          className={`h-4 w-4 text-zinc-200 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          <div className="glass-chip flex items-center gap-2 rounded-xl p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی غذا برای دیدن جایگزین‌هاش..."
              className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/50 outline-none"
            />

            <Search size={16} className="ml-1 shrink-0 text-white/60" />
          </div>

          {visible.length === 0 ? (
            <p className="py-3 text-center text-sm text-white">
              جایگزینی پیدا نشد.
            </p>
          ) : (
            // Bounded and scrollable for the same reason the plan editor's
            // food list is: the full set of groups is far taller than the
            // card it lives in, and it sits above the free-meal card.
            <div className="max-h-76 space-y-5 overflow-y-auto overscroll-contain pl-1">
              {visible.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-2 font-semibold text-white">
                    {group.title}
                  </h3>

                  <ul className="space-y-1 text-white">
                    {group.foods.map((food) => (
                      <li key={food}>• {food}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
