const KEY = "emad-workout";

export function saveWorkoutCompleted() {
  localStorage.setItem(KEY, "completed");
}

export function isWorkoutCompleted() {
  return localStorage.getItem(KEY) === "completed";
}

export function resetWorkoutCompleted() {
  localStorage.removeItem(KEY);
}