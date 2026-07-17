import Header from "@/components/Header";
import HeroCard from "@/components/HeroCard";
import InfoCard from "@/components/InfoCard";

import {
  ClipboardList,
  Dumbbell,
  Footprints,
} from "lucide-react";

import { getSession } from "@/utils/sessionEngine";
import {
  getCurrentProgramDay,
  getCurrentWorkout,
} from "@/utils/programEngine";

function HomePage() {
  const session = getSession();

  const day = getCurrentProgramDay();

  const workout = getCurrentWorkout();

  const isWorkout = day.activity === "workout";

  return (
    <div className="pb-32">
      <Header />

      <section className="space-y-4 px-6">
        <HeroCard
          title="Today's Activity"
          emoji={isWorkout ? "🏋️" : "🚶"}
          status={
            isWorkout
              ? workout?.title ?? day.title
              : "Recovery Walk"
          }
          description={
            isWorkout
              ? `Today's workout is ${
                  workout?.title ?? day.title
                }.`
              : "Walk for 45–60 minutes."
          }
        />

        <InfoCard
          icon={isWorkout ? <Dumbbell /> : <Footprints />}
          title={
            isWorkout
              ? "Workout"
              : "Recovery"
          }
          value={
            isWorkout
              ? workout?.title ?? day.title
              : "45–60 min walk"
          }
        />

        <InfoCard
          icon={<ClipboardList />}
          title="Today's Status"
          value={
            session.completed
              ? "Completed ✅"
              : "Not completed"
          }
        />
      </section>
    </div>
  );
}

export default HomePage;