import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NutritionPlanLibraryPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h1 className="text-center text-2xl font-bold">
        برنامه غذایی
      </h1>

      <div className="space-y-3">
        <button
          onClick={() => navigate("/settings/nutrition/workout")}
          className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold">
            برنامه غذایی روزهای تمرین
          </h2>

          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </button>

        <button
          onClick={() => navigate("/settings/nutrition/rest")}
          className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold">
            برنامه غذایی روزهای استراحت
          </h2>

          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}
