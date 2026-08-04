import type { WorkoutTaxonomyNode } from "@/data/workoutTaxonomy";

export interface WorkoutTaxonomyGridProps {
  nodes: WorkoutTaxonomyNode[];
  onSelect: (node: WorkoutTaxonomyNode) => void;
}

// Two square cards per row, used both for the library's root (the six top
// categories) and every nested category screen underneath it — same shape
// whether a card leads to another list or straight into a workout.
export default function WorkoutTaxonomyGrid({
  nodes,
  onSelect,
}: WorkoutTaxonomyGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {nodes.map((node) => (
        <button
          key={node.id}
          onClick={() => onSelect(node)}
          className="glass-panel flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl p-3 text-center"
        >
          <span className="text-3xl">{node.icon}</span>
          <span className="text-sm leading-snug font-semibold text-white">
            {node.title}
          </span>
        </button>
      ))}
    </div>
  );
}
