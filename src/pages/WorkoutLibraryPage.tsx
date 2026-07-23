import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getLibrary } from "@/store/workoutLibraryStore";
import { toFaDigits } from "@/utils/numberFormat";

export default function WorkoutLibraryPage() {
  const navigate = useNavigate();
  const workouts = getLibrary();

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <h1 className="text-2xl font-bold">
        کتابخانه تمرین‌ها
      </h1>

      <div className="space-y-3">
        {workouts.map((workout) => (
          <button
            key={workout.id}
            onClick={() =>
              navigate(`/settings/workouts/${workout.id}`)
            }
            className="glass-panel flex w-full items-center justify-between rounded-2xl p-4"
          >
            <div className="text-right">
              <h2 className="text-lg font-semibold">
                {workout.title}
              </h2>

              <p className="text-sm text-white">
                {toFaDigits(workout.groups.length)} گروه عضلانی
              </p>
            </div>

            <ChevronRight className="h-5 w-5 text-zinc-200" />
          </button>
        ))}
      </div>
    </div>
  );
}