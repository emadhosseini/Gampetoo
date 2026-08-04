import { useNavigate } from "react-router-dom";

import WorkoutTaxonomyGrid from "@/components/WorkoutTaxonomyGrid";
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
      <h1 className="text-2xl font-bold">کتابخانه تمرین‌ها</h1>

      <WorkoutTaxonomyGrid nodes={workoutTaxonomy} onSelect={handleSelect} />
    </div>
  );
}
