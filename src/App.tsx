import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Layout from "@/components/Layout";

import HomePage from "@/pages/HomePage";
import WorkoutPage from "@/pages/WorkoutPage";
import NutritionPage from "@/pages/NutritionPage";
import SettingsPage from "@/pages/SettingsPage";
import SetupProgramPage from "@/pages/SetupProgramPage";
import WorkoutLibraryPage from "@/pages/WorkoutLibraryPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";

import { hasStartDate } from "@/utils/programEngine";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const initialized = hasStartDate();

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
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}