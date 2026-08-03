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

import HomePage from "@/pages/HomePage";
import DailyProgramPage from "@/pages/DailyProgramPage";
import ProgressPage from "@/pages/ProgressPage";
import DailyLogPage from "@/pages/DailyLogPage";
import SetupProgramPage from "@/pages/SetupProgramPage";
import WorkoutLibraryPage from "@/pages/WorkoutLibraryPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import ProgramBuilderPage from "@/pages/ProgramBuilderPage";
import NutritionPlanLibraryPage from "@/pages/NutritionPlanLibraryPage";
import NutritionPlanDetailPage from "@/pages/NutritionPlanDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import WeightDetailPage from "@/pages/WeightDetailPage";
import CaloriesDetailPage from "@/pages/CaloriesDetailPage";
import WaterDetailPage from "@/pages/WaterDetailPage";
import ActivityDetailPage from "@/pages/ActivityDetailPage";

import { hasCurrentUsername } from "@/utils/userEngine";
import { initSync } from "@/sync/remoteSync";

initSync();

export default function App() {
  return (
    <BrowserRouter>
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
          path="/progress/water"
          element={<WaterDetailPage />}
        />

        <Route
          path="/progress/activity"
          element={<ActivityDetailPage />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}