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

/**
 * BMR-based calories-burned estimate — scales resting metabolic rate
 * (bmrPerDay ÷ 1440, i.e. per minute) by MET, rather than assuming a fixed
 * population-average RMR per kg the way the plain weight-only formula
 * above does. More personalized: the caller's BMR (Mifflin-St Jeor, see
 * calorieEngine.calculateBmr) already factors in height, age and gender,
 * not just weight, so two people who weigh the same but differ in height/
 * age/gender get different estimates here instead of an identical one.
 */
export function calculateBurnedCaloriesFromBmr(
  met: number,
  bmrPerDay: number,
  durationMinutes: number,
): number {
  return Math.round(met * (bmrPerDay / 1440) * durationMinutes);
}
