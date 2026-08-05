// Active account identity. Everything else in localStorage is scoped by this
// username (see scopedKey). The display name is stored per-account.
const USERNAME_KEY = "emad-current-username";

// Per-account display name (scoped by username), e.g. "emad-user-name:<username>".
const NAME_KEY = "emad-user-name";

// Per-account gender (scoped by username), used to pick a matching avatar.
const GENDER_KEY = "emad-user-gender";

// Per-account height in cm (scoped by username), used for the BMI card.
const HEIGHT_KEY = "emad-user-height";

// Per-account age in years (scoped by username). Superseded by the birth
// date below and no longer written by anything — kept only so an account
// that entered an age in the calorie calculator before birth dates existed
// doesn't lose it. See getCurrentUserAge.
const AGE_KEY = "emad-user-age";

// Per-account date of birth (scoped by username), stored as a Gregorian ISO
// date (YYYY-MM-DD) like every other date in the app. This is the source of
// truth for the user's age: a stored age is correct on the day it's typed
// and quietly wrong from the next birthday onward, whereas a birth date
// never goes stale.
const BIRTH_DATE_KEY = "emad-user-birth-date";

export type Gender = "male" | "female";

// Pre-username scheme: a single global name that also acted as the data scope.
// Kept only so existing users can be detected and migrated to a username.
const LEGACY_NAME_KEY = "emad-current-user";

// Base keys that were (and still are) scoped by the active identity. Used when
// migrating a legacy, name-scoped account onto its new username.
const SCOPED_BASES = [
  "emad-programs",
  "emad-session",
  "emad-free-meal",
  "emad-workout-library-overrides",
  "emad-warmup-library-overrides",
  "emad-user-gender",
  "emad-user-height",
];

export function getCurrentUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function setCurrentUsername(username: string) {
  localStorage.setItem(USERNAME_KEY, username);
}

export function hasCurrentUsername(): boolean {
  return !!getCurrentUsername();
}

/**
 * Scope a storage key to the active account. Falls back to the bare key when no
 * user is set yet (e.g. mid-setup), matching the previous behaviour.
 */
export function scopedKey(key: string): string {
  const username = getCurrentUsername();

  return username ? `${key}:${username}` : key;
}

export function getCurrentUserName(): string | null {
  return (
    localStorage.getItem(scopedKey(NAME_KEY)) ??
    // Transitional fallback for a not-yet-migrated legacy account.
    localStorage.getItem(LEGACY_NAME_KEY)
  );
}

export function setCurrentUserName(name: string) {
  localStorage.setItem(scopedKey(NAME_KEY), name);
}

export function getCurrentUserGender(): Gender | null {
  const value = localStorage.getItem(scopedKey(GENDER_KEY));

  return value === "male" || value === "female" ? value : null;
}

export function setCurrentUserGender(gender: Gender) {
  localStorage.setItem(scopedKey(GENDER_KEY), gender);
}

export function getCurrentUserHeight(): number | null {
  const value = Number(localStorage.getItem(scopedKey(HEIGHT_KEY)));

  return Number.isFinite(value) && value > 0 ? value : null;
}

export function setCurrentUserHeight(heightCm: number) {
  localStorage.setItem(scopedKey(HEIGHT_KEY), String(heightCm));
}

export function getCurrentUserBirthDate(): string | null {
  const value = localStorage.getItem(scopedKey(BIRTH_DATE_KEY));

  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function setCurrentUserBirthDate(isoDate: string) {
  localStorage.setItem(scopedKey(BIRTH_DATE_KEY), isoDate);
}

/**
 * Whole years between a Gregorian ISO birth date and `on` (today by
 * default). The birthday itself counts, so someone turns N on the day
 * rather than the day after. Null for an unparseable or future date.
 *
 * Takes `on` as a parameter rather than reading the clock itself so the
 * boundary cases (the day before a birthday, the birthday, a Feb 29 birth
 * date in a non-leap year) are checkable.
 */
export function ageFromBirthDate(
  birthIso: string,
  on: Date = new Date(),
): number | null {
  const [year, month, day] = birthIso.split("-").map(Number);

  if (![year, month, day].every((part) => Number.isFinite(part))) {
    return null;
  }

  const hadBirthdayThisYear =
    on.getMonth() + 1 > month ||
    (on.getMonth() + 1 === month && on.getDate() >= day);

  const age = on.getFullYear() - year - (hadBirthdayThisYear ? 0 : 1);

  return age >= 0 ? age : null;
}

/**
 * The user's age in whole years — derived from their birth date, so it
 * stays right without anyone re-entering it.
 */
export function getCurrentUserAge(): number | null {
  const birthDate = getCurrentUserBirthDate();

  if (birthDate !== null) {
    return ageFromBirthDate(birthDate);
  }

  // Accounts that typed a plain age into the calorie calculator before
  // birth dates existed. Nothing writes this key any more — it's read only
  // so those accounts keep a working calorie goal until they set a birth
  // date, after which the branch above takes over for good.
  const value = Number(localStorage.getItem(scopedKey(AGE_KEY)));

  return Number.isFinite(value) && value > 0 ? value : null;
}

export function hasCurrentUser(): boolean {
  return hasCurrentUsername();
}

/**
 * True when data exists from the old name-scoped scheme and no username has been
 * chosen yet — i.e. an existing user who needs to pick a username once.
 */
export function hasLegacyData(): boolean {
  if (getCurrentUsername()) {
    return false;
  }

  const legacyName = localStorage.getItem(LEGACY_NAME_KEY);

  if (!legacyName) {
    return false;
  }

  return localStorage.getItem(`emad-programs:${legacyName}`) !== null;
}

/**
 * Move a legacy (name-scoped) account's data onto `username`. Call this AFTER
 * setCurrentUsername(username). Existing keys are never overwritten, and the
 * original keys are left in place as a safety backup — only the legacy-name
 * marker is removed so migration doesn't run again.
 */
export function migrateLegacyDataTo(username: string) {
  const legacyName = localStorage.getItem(LEGACY_NAME_KEY);

  if (!legacyName) {
    return;
  }

  for (const base of SCOPED_BASES) {
    const from = `${base}:${legacyName}`;
    const to = `${base}:${username}`;
    const value = localStorage.getItem(from);

    if (value !== null && localStorage.getItem(to) === null) {
      localStorage.setItem(to, value);
    }
  }

  // Carry the old name over as this account's display name.
  const nameKey = `${NAME_KEY}:${username}`;

  if (localStorage.getItem(nameKey) === null) {
    localStorage.setItem(nameKey, legacyName);
  }

  localStorage.removeItem(LEGACY_NAME_KEY);
}

/**
 * Log out of the active account without deleting any of its data, so a different
 * username can be entered. The account's data stays under its scoped keys.
 */
export function logoutCurrentUser() {
  localStorage.removeItem(USERNAME_KEY);
}

/**
 * Clear the profile fields that belong to the account itself. Separate from
 * resetCurrentUser() below because these are synced keys: they have to be
 * gone before a reset pushes its snapshot to the server, or the server keeps
 * a copy and hands it back at the next login.
 */
export function resetUserProfile() {
  localStorage.removeItem(scopedKey(NAME_KEY));
  localStorage.removeItem(scopedKey(GENDER_KEY));
  localStorage.removeItem(scopedKey(HEIGHT_KEY));
  localStorage.removeItem(scopedKey(AGE_KEY));
  localStorage.removeItem(scopedKey(BIRTH_DATE_KEY));
}

/**
 * Clear the active identity as part of a factory reset. Must run AFTER the
 * scoped reset*() calls (which rely on the username still being set).
 */
export function resetCurrentUser() {
  resetUserProfile();
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(LEGACY_NAME_KEY);
}
