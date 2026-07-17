export type ActivityType = "workout" | "walk";

export function getTodayActivity(): ActivityType {
  const day = new Date().getDay();

  return day % 2 === 0 ? "workout" : "walk";
}