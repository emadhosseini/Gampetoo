import { useNavigate } from "react-router-dom";

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
  hasStartDate,
  getWorkoutTypeForDate,
} from "@/utils/programEngine";

import { getWorkout } from "@/store/workoutLibraryStore";
import {
  walkCharacterIcon,
  workoutCharacterIcon,
} from "@/data/characterIcons";
import { getCurrentUserGender } from "@/utils/userEngine";
import { formatTodayFull } from "@/utils/dateFormat";
import { toFaDigits } from "@/utils/numberFormat";
import { t } from "@/i18n/t";

function HomePage() {
  const navigate = useNavigate();

  // No workout program built yet (first run, or an account that logged in
  // fresh without one) — a single card replaces the usual three, since
  // today/tomorrow/status are all meaningless without any days configured.
  if (!hasStartDate()) {
    return (
      <div className="pb-32">
        <Header />

        <section className="space-y-4 px-6">
          <HeroCard
            title={t("home.setupTitle")}
            emoji="🗓"
            status={t("home.setupStatus")}
            onClick={() => navigate("/settings/program")}
          />
        </section>
      </div>
    );
  }

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

  // Read fresh on every render rather than held anywhere, so changing the
  // gender in the profile is reflected the moment this page renders again.
  // Null before the program starts, and for a workout type with no drawn
  // icon — HeroCard falls back to its emoji in both cases.
  const gender = getCurrentUserGender();

  const heroIconSrc = !started
    ? null
    : isWorkout
      ? workoutCharacterIcon(workoutType, gender)
      : walkCharacterIcon(gender);

  const tomorrowCard = (
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
      title={t("home.tomorrowPlan")}
      value={
        !tomorrowStarted
          ? t("home.noTomorrowPlan")
          : isTomorrowWorkout
            ? tomorrowWorkout?.title ?? tomorrowDay.title
            : t("home.rest")
      }
    />
  );

  return (
    <div className="pb-32">
      <Header />

      <section className="space-y-4 px-6">
        <HeroCard
          // Where "برنامه امروز" used to sit — today's date instead, since
          // that's the thing actually worth saying here that the rest of
          // the card doesn't already say some other way.
          title={formatTodayFull()}
          emoji={!started ? "🗓" : isWorkout ? "🏋️" : "🚶"}
          iconSrc={heroIconSrc ?? undefined}
          status={
            !started
              ? t("home.noTodayPlan")
              : isWorkout
                ? workout?.title || day.title
                : t("home.restDay")
          }
          description={
            !started
              ? daysUntilStart === 1
                ? t("home.startsTomorrow")
                : t("home.startsInDays", { days: toFaDigits(daysUntilStart) })
              : undefined
          }
        />

        {/* Side by side only once there's a second card to sit beside —
            وضعیت برنامه امروز has nothing to report before the program has
            actually started, so برنامه فردا stays full width alone rather
            than sitting in an empty-looking two-column row. */}
        {started ? (
          <div className="grid grid-cols-2 gap-4">
            <InfoCard
              icon={<ClipboardList />}
              title={t("home.todayStatus")}
              value={session.completed ? t("home.done") : t("home.notDone")}
            />

            {tomorrowCard}
          </div>
        ) : (
          tomorrowCard
        )}
      </section>
    </div>
  );
}

export default HomePage;