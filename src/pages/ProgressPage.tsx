import TodayDashboardCard from "@/components/progress/TodayDashboardCard";

// The old square stat tiles (weight, calorie, activity, water) are all
// gone now — each moved into its own tappable card inside
// TodayDashboardCard instead.
export default function ProgressPage() {
  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <TodayDashboardCard />
    </div>
  );
}
