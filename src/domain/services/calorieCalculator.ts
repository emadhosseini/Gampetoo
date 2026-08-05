/**
 * Standard MET (Metabolic Equivalent of Task) formula for estimating
 * calories burned by an activity:
 *
 *   Calories = (MET × 3.5 × weightKg / 200) × durationMinutes
 *
 * Pure and side-effect-free — the one place this math happens. Callers
 * (session/activity engines) own looking up the inputs and persisting the
 * result; no calorie math belongs in a UI component.
 */
export function calculateBurnedCalories(
  met: number,
  weightKg: number,
  durationMinutes: number,
): number {
  return Math.round(((met * 3.5 * weightKg) / 200) * durationMinutes);
}
