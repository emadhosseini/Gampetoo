const CURRENT_USER_KEY = "emad-current-user";

export function getCurrentUserName(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUserName(name: string) {
  localStorage.setItem(CURRENT_USER_KEY, name);
}

export function hasCurrentUser(): boolean {
  return !!getCurrentUserName();
}

export function resetCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function scopedKey(key: string): string {
  const user = getCurrentUserName();

  return user ? `${key}:${user}` : key;
}
