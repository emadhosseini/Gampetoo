import type { WorkoutType } from "@/types/program";
import type { Gender } from "@/utils/userEngine";

// Served straight from public/icons as root-relative URLs, the same way
// /BG.webp is — so they're copied verbatim into the build and precached by
// the service worker along with every other static asset (the workbox glob
// already covers webp), rather than being refetched on a cold start.
const BASE = "/icons";

// Which workout types have a drawn pair. cardio, warmup and custom don't —
// callers fall back to their emoji for anything missing here, so supplying
// the two files and adding one line is all a new one needs.
//
// It has to be an allow-list rather than a URL built from the type name and
// left to 404: this is a SPA, so an unknown path serves index.html with a
// 200, and an <img> pointed at it renders a broken-image glyph instead of
// failing quietly back to the emoji.
const WORKOUT_ICON_NAMES: Partial<Record<WorkoutType, string>> = {
  push: "push",
  pull: "pull",
  legs: "legs",
  upper: "upper",
  lower: "lower",
  full_body: "full-body",
};

// Male when no gender has been chosen. Every icon in the app resolves
// through this one function, so picking زن in the profile switches all of
// them at once — there's nothing cached per-icon to go stale.
function suffixFor(gender: Gender | null): "male" | "female" {
  return gender === "female" ? "female" : "male";
}

/** The illustration for a workout type, or null if none was drawn for it. */
export function workoutCharacterIcon(
  workoutType: WorkoutType | null,
  gender: Gender | null,
): string | null {
  const name = workoutType !== null ? WORKOUT_ICON_NAMES[workoutType] : undefined;

  return name ? `${BASE}/${name}-${suffixFor(gender)}.webp` : null;
}

/** The rest-day illustration — the walk a rest day actually asks for. */
export function walkCharacterIcon(gender: Gender | null): string {
  return `${BASE}/walk-${suffixFor(gender)}.webp`;
}

/**
 * The account's avatar. Unlike the workout illustrations above, an unset
 * gender gets its own neutral portrait rather than defaulting to male —
 * there's a drawn one for exactly this case, so there's no need to guess at
 * something the user hasn't told us.
 */
export function avatarCharacterIcon(gender: Gender | null): string {
  const name = gender === null ? "default" : suffixFor(gender);

  return `${BASE}/avatar-${name}.webp`;
}
