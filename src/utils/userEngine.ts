// Active account identity. Everything else in localStorage is scoped by this
// username (see scopedKey). The display name is stored per-account.
const USERNAME_KEY = "emad-current-username";

// Per-account display name (scoped by username), e.g. "emad-user-name:<username>".
const NAME_KEY = "emad-user-name";

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
 * Clear the active identity as part of a factory reset. Must run AFTER the
 * scoped reset*() calls (which rely on the username still being set).
 */
export function resetCurrentUser() {
  localStorage.removeItem(scopedKey(NAME_KEY));
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(LEGACY_NAME_KEY);
}
