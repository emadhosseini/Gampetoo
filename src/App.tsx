import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Layout from "@/components/Layout";
import PwaUpdater from "@/components/PwaUpdater";
import WhatsNewNotifier from "@/components/WhatsNewNotifier";
import DomainMigrationNotice from "@/components/DomainMigrationNotice";

import HomePage from "@/pages/HomePage";
import DailyProgramPage from "@/pages/DailyProgramPage";
import ProgressPage from "@/pages/ProgressPage";
import DailyLogPage from "@/pages/DailyLogPage";
import SetupProgramPage from "@/pages/SetupProgramPage";
import WorkoutLibraryPage from "@/pages/WorkoutLibraryPage";
import WorkoutCategoryPage from "@/pages/WorkoutCategoryPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import ProgramBuilderPage from "@/pages/ProgramBuilderPage";
import NutritionPlanLibraryPage from "@/pages/NutritionPlanLibraryPage";
import NutritionPlanDetailPage from "@/pages/NutritionPlanDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import WeightDetailPage from "@/pages/WeightDetailPage";
import CaloriesDetailPage from "@/pages/CaloriesDetailPage";
import ActivityDetailPage from "@/pages/ActivityDetailPage";
import CalorieBudgetDetailPage from "@/pages/CalorieBudgetDetailPage";

import { hasCurrentUsername } from "@/utils/userEngine";
import { initSync } from "@/sync/remoteSync";
import { mergeExerciseIds } from "@/domain/migrations/mergeExerciseIds";

// Before initSync, deliberately: the migration rewrites the very keys the
// sync engine watches, so it has to finish while nothing is listening —
// otherwise the rewrite itself would be pushed as a change mid-flight.
mergeExerciseIds();
initSync();

export default function App() {
  return (
    <BrowserRouter>
      <DomainMigrationNotice />
      <PwaUpdater />
      <WhatsNewNotifier />
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  useLocation();

  const initialized = hasCurrentUsername();

  if (!initialized) {
    return (
      <Routes>
        <Route
          path="/setup"
          element={<SetupProgramPage />}
        />

        <Route
          path="*"
          element={<Navigate to="/setup" replace />}
        />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/daily-program"
          element={<DailyProgramPage />}
        />

        <Route
          path="/progress"
          element={<ProgressPage />}
        />

        <Route
          path="/daily-log"
          element={<DailyLogPage />}
        />

        <Route
          path="/settings/workouts"
          element={<WorkoutLibraryPage />}
        />

        <Route
          path="/settings/workouts/browse/*"
          element={<WorkoutCategoryPage />}
        />

        <Route
          path="/settings/workouts/:id"
          element={<WorkoutDetailPage />}
        />

        <Route
          path="/settings/program"
          element={<ProgramBuilderPage />}
        />

        <Route
          path="/settings/nutrition"
          element={<NutritionPlanLibraryPage />}
        />

        <Route
          path="/settings/nutrition/:type"
          element={<NutritionPlanDetailPage />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        <Route
          path="/progress/weight"
          element={<WeightDetailPage />}
        />

        <Route
          path="/progress/calories"
          element={<CaloriesDetailPage />}
        />

        <Route
          path="/progress/activity"
          element={<ActivityDetailPage />}
        />

        <Route
          path="/progress/calorie-budget"
          element={<CalorieBudgetDetailPage />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}