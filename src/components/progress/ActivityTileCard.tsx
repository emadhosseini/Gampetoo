import { Flame } from "lucide-react";

import { getTodayActivityCalories } from "@/utils/activityLogEngine";
import { getTodayWorkoutCalories } from "@/utils/workoutCalorieEngine";
import { toFaDigits } from "@/utils/numberFormat";

const FLAME_COLOR = "#f97316";

export interface ActivityTileCardProps {
  onClick: () => void;
}

// The progress page's activity tile. Deliberately has no progress ring:
// unlike calories (which has a target) there's no activity goal to
// measure against, and a ring drawn at some arbitrary fraction would be
// inventing one. A flame badge over the burned-calorie count keeps the
// tile's visual weight in line with the three it shares the grid with.
export default function ActivityTileCard({ onClick }: ActivityTileCardProps) {
  // Manually-logged activity and workout-program calories (see
  // sessionEngine.ts's toggleExerciseChecked) are tracked separately —
  // see DailyLogPage's activity tab for the two reported individually —
  // but this tile's own "how much did I burn today" number stays a single
  // combined total across both sources.
  const calories = getTodayActivityCalories() + getTodayWorkoutCalories();

  return (
    <button
      onClick={onClick}
      className="glass-panel flex w-full flex-col justify-center rounded-2xl p-4"
    >
      <div className="mx-auto flex aspect-square w-full max-w-32 flex-col items-center justify-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: `${FLAME_COLOR}26`, color: FLAME_COLOR }}
        >
          <Flame size={26} />
        </div>

        <span className="mt-2 text-2xl font-bold leading-tight text-white">
          {toFaDigits(calories)}
        </span>
        <span className="text-xs text-white/60">کالری</span>
      </div>

      <p className="mt-2 text-center text-sm font-semibold" style={{ color: FLAME_COLOR }}>
        فعالیت
      </p>
    </button>
  );
}
