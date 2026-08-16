import { useState } from "react";

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
  // Bumped when the calorie-goal flow saves. Every row here reads straight
  // from localStorage during render with nothing reactive in between, so a
  // save inside CalorieOrbCard refreshed only that card — the protein row
  // beside it (target = weight × goal, both of which that flow writes) and
  // the weight row above it went on showing the old numbers until the page
  // was left and come back to. Remounting them on the key is enough: their
  // reads happen on render, so a fresh mount is a fresh read.
  const [version, setVersion] = useState(0);

  return (
    <div className="glass-panel glass-static w-full rounded-2xl p-4">
      <h2 className="text-center text-sm font-semibold text-white/70">
        داشبورد امروز
      </h2>

      <div className="mt-2 flex flex-col gap-3">
        {/* Weight leads the card now — the rest (calorie/protein/water)
            follow below it, each set off with the same divider line. */}
        <WeightProgressRow key={version} />

        {/* CalorieOrbCard's circle is a fixed h-36 (~144px) regardless of
            its wrapper's height — min-h-40 (not h-40) just guarantees at
            least that much room; it can still grow past it (e.g. its text
            column wrapped in its own card now needs a bit more), rather
            than clipping or overlapping the row below. */}
        <div className="min-h-40 shrink-0 border-t border-white/10 pt-3">
          <CalorieOrbCard onGoalSaved={() => setVersion((v) => v + 1)} />
        </div>

        <div className="border-t border-white/10 pt-3">
          <ProteinProgressRow key={version} />
        </div>

        <div className="border-t border-white/10 pt-3">
          <WaterProgressRow />
        </div>
      </div>
    </div>
  );
}
