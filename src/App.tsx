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
import SetPasswordPrompt from "@/components/SetPasswordPrompt";

import HomePage from "@/pages/HomePage";
import WorkoutPage from "@/pages/WorkoutPage";
import NutritionPage from "@/pages/NutritionPage";
import SettingsPage from "@/pages/SettingsPage";
import SetupProgramPage from "@/pages/SetupProgramPage";
import WorkoutLibraryPage from "@/pages/WorkoutLibraryPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import ProgramBuilderPage from "@/pages/ProgramBuilderPage";
import NutritionPlanLibraryPage from "@/pages/NutritionPlanLibraryPage";
import NutritionPlanDetailPage from "@/pages/NutritionPlanDetailPage";

import { hasStartDate } from "@/utils/programEngine";
import { hasCurrentUsername } from "@/utils/userEngine";
import { initSync } from "@/sync/remoteSync";

initSync();

export default function App() {
  return (
    <BrowserRouter>
      <PwaUpdater />
      <WhatsNewNotifier />
      <SetPasswordPrompt />
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  useLocation();

  const initialized = hasCurrentUsername() && hasStartDate();

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
          path="/workout"
          element={<WorkoutPage />}
        />

        <Route
          path="/nutrition"
          element={<NutritionPage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
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
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}