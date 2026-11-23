import type { NavigateFunction } from "react-router-dom";

export function parentRouteFor(pathname: string): string {
  if (pathname.startsWith("/settings/workouts/browse/")) {
    const rest = pathname
      .slice("/settings/workouts/browse/".length)
      .split("/")
      .filter(Boolean);
    if (rest.length > 1) {
      return `/settings/workouts/browse/${rest.slice(0, -1).join("/")}`;
    }
    return "/settings/workouts";
  }
  if (pathname.startsWith("/settings/workouts/")) return "/settings/workouts";
  if (pathname === "/settings/workouts") return "/";
  if (pathname === "/settings/program") return "/";
  if (pathname.startsWith("/settings/nutrition/")) return "/settings/nutrition";
  if (pathname === "/settings/nutrition") return "/";
  if (pathname === "/profile") return "/";
  if (pathname.startsWith("/progress/body-measurements/")) {
    return "/progress/body-measurements";
  }
  if (pathname.startsWith("/progress/")) return "/progress";
  return "/";
}

export function navigateBackSafely(
  navigate: NavigateFunction,
  pathname: string,
): void {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  if (typeof idx === "number" && idx > 0) {
    navigate(-1);
  } else {
    navigate(parentRouteFor(pathname));
  }
}
