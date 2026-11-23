import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import WorkoutTaxonomyGrid from "@/components/WorkoutTaxonomyGrid";
import { navigateBackSafely } from "@/utils/navigationBack";
import { workoutTaxonomy } from "@/data/workoutTaxonomy";
import type { WorkoutTaxonomyNode } from "@/data/workoutTaxonomy";

// The library's front door: the six top-level categories, as square cards.
// Every one of them is a branch (never a bare workout at this level), so
// tapping always drills into WorkoutCategoryPage next.
export default function WorkoutLibraryPage() {
  const navigate = useNavigate();

  function handleSelect(node: WorkoutTaxonomyNode) {
    navigate(`/settings/workouts/browse/${node.id}`);
  }

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <div className="relative flex items-center justify-center">
        <button
          onClick={() => navigateBackSafely(navigate, "/settings/workouts")}
          aria-label="بازگشت"
          className="glass-chip absolute right-0 flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronRight size={18} />
        </button>

        <h1 className="text-center text-2xl font-bold">کتابخانه تمرین‌ها</h1>
      </div>

      <WorkoutTaxonomyGrid nodes={workoutTaxonomy} onSelect={handleSelect} />
    </div>
  );
}
