import CalorieOrbCard from "@/components/progress/CalorieOrbCard";
import ProteinProgressRow from "@/components/progress/ProteinProgressRow";
import WaterProgressRow from "@/components/progress/WaterProgressRow";
import WeightProgressRow from "@/components/progress/WeightProgressRow";

// A big card below the four stat tiles, stacking the calorie orb, protein
// and water — each of the latter two set off from what's above it with a
// divider line, the same way protein originally separated from the orb.
// Height is no longer fixed/split by percentage (it was, back when this
// only held two sections): with three, natural content height per section
// plus dividers reads better than forcing an arbitrary total and dividing
// it up further.
//
// Not a button — nothing on it is tappable — so .glass-static keeps it
// from scaling on tap the way the tiles above (real buttons) do.
export default function TodayDashboardCard() {
  return (
    <div className="glass-panel glass-static w-full rounded-2xl p-4">
      <h2 className="text-center text-sm font-semibold text-white/70">
        داشبورد امروز
      </h2>

      <div className="mt-2 flex flex-col gap-3">
        {/* CalorieOrbCard's circle is a fixed h-36 (~144px) regardless of
            its wrapper's height — min-h-40 (not h-40) just guarantees at
            least that much room; it can still grow past it (e.g. its text
            column wrapped in its own card now needs a bit more), rather
            than clipping or overlapping the row below. */}
        <div className="min-h-40 shrink-0">
          <CalorieOrbCard />
        </div>

        <div className="border-t border-white/10 pt-3">
          <ProteinProgressRow />
        </div>

        <div className="border-t border-white/10 pt-3">
          <WaterProgressRow />
        </div>

        {/* Experimental — trying the water/protein row style for weight
            too. */}
        <div className="border-t border-white/10 pt-3">
          <WeightProgressRow />
        </div>
      </div>
    </div>
  );
}
