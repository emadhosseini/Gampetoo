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
  getCurrentWorkoutType,
  getDaysUntilStart,
  getProgramDay,
  hasProgramStarted,
  getWorkoutTypeForDate,
} from "@/utils/programEngine";

import { getWorkout } from "@/store/workoutLibraryStore";
import { toFaDigits } from "@/utils/numberFormat";

function HomePage() {
  const session = getSession();

  const day = getCurrentProgramDay();

  const workoutType = getCurrentWorkoutType();

const workout = workoutType
  ? getWorkout(workoutType)
  : undefined;

  const isWorkout = day.activity === "workout";

  const started = hasProgramStarted();
  const daysUntilStart = getDaysUntilStart();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowStarted = hasProgramStarted(tomorrow);

  const tomorrowDay = getProgramDay(tomorrow);

  const tomorrowWorkoutType = getWorkoutTypeForDate(tomorrow);

  const tomorrowWorkout = tomorrowWorkoutType
    ? getWorkout(tomorrowWorkoutType)
    : undefined;

  const isTomorrowWorkout = tomorrowDay.activity === "workout";

  return (
    <div className="pb-32">
      <Header />

      <section className="space-y-4 px-6">
        <HeroCard
          title="برنامه امروز"
          emoji={!started ? "🗓" : isWorkout ? "🏋️" : "🚶"}
          status={
            !started
              ? "امروز برنامه‌ای نداری"
              : isWorkout
                ? workout?.title || day.title
                : "روز استراحت"
          }
          description={
            !started
              ? daysUntilStart === 1
                ? "اولین برنامه فردا شروع می‌شه"
                : `اولین برنامه از ${toFaDigits(daysUntilStart)} روز دیگه شروع می‌شه`
              : isWorkout
                ? undefined
                : "استراحت و پیاده روی سبک به مدت ۴۵ تا ۶۰ دقیقه"
          }
        />

        <InfoCard
          icon={
            !tomorrowStarted ? (
              <Footprints />
            ) : isTomorrowWorkout ? (
              <Dumbbell />
            ) : (
              <Footprints />
            )
          }
          title="برنامه فردا"
          value={
            !tomorrowStarted
              ? "فردا برنامه‌ای نداری\nاستراحت و پیاده روی کن"
              : isTomorrowWorkout
                ? tomorrowWorkout?.title ?? tomorrowDay.title
                : "استراحت و پیاده روی سبک\nبه مدت ۴۵ تا ۶۰ دقیقه"
          }
        />

        {started && (
          <InfoCard
            icon={<ClipboardList />}
            title="وضعیت برنامه امروز"
            value={
              session.completed
                ? "انجام شده ✅"
                : "انجام نشده"
            }
          />
        )}
      </section>
    </div>
  );
}

export default HomePage;