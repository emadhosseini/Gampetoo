import { ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import WorkoutTaxonomyGrid from "@/components/WorkoutTaxonomyGrid";
import { findTaxonomyNode } from "@/data/workoutTaxonomy";
import type { WorkoutTaxonomyNode } from "@/data/workoutTaxonomy";

// Any depth below the library's root six categories — matched via a splat
// route (/settings/workouts/browse/*) since branches nest up to three
// levels deep (e.g. ذهن/جسم → Pilates → Core Stability). Walks the
// taxonomy tree using the URL's path segments as the route from root to
// here; tapping a child either drills one level further (another branch)
// or leaves the taxonomy entirely for the real workout page (a leaf).
export default function WorkoutCategoryPage() {
  const navigate = useNavigate();
  const { "*": splat } = useParams();
  const segments = (splat ?? "").split("/").filter(Boolean);

  const node = findTaxonomyNode(segments);

  if (!node || node.kind !== "branch") {
    return (
      <div className="px-5 pb-5 pt-10 text-center">
        <p className="text-white">این بخش پیدا نشد.</p>
      </div>
    );
  }

  function handleSelect(child: WorkoutTaxonomyNode) {
    if (child.kind === "branch") {
      navigate(`/settings/workouts/browse/${[...segments, child.id].join("/")}`);
    } else {
      navigate(`/settings/workouts/${child.workoutId}`);
    }
  }

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <div className="relative flex items-center justify-center">
        <button
          onClick={() => navigate(-1)}
          aria-label="بازگشت"
          className="glass-chip absolute right-0 flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronRight size={18} />
        </button>

        <h1 className="text-lg font-bold">{node.title}</h1>
      </div>

      <WorkoutTaxonomyGrid nodes={node.children} onSelect={handleSelect} />
    </div>
  );
}
