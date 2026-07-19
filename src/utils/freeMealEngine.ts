import { scopedKey } from "./userEngine";

const STORAGE_KEY = "emad-free-meal";
const LOCK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

interface FreeMealState {
  usedAt: string;
}

export function isFreeMealLocked(): boolean {
  const saved = localStorage.getItem(storageKey());

  if (!saved) {
    return false;
  }

  let state: FreeMealState;

  try {
    state = JSON.parse(saved) as FreeMealState;
  } catch {
    return false;
  }

  const usedAt = new Date(state.usedAt).getTime();

  if (Date.now() - usedAt >= LOCK_DURATION_MS) {
    localStorage.removeItem(storageKey());
    return false;
  }

  return true;
}

export function markFreeMealUsed() {
  const state: FreeMealState = { usedAt: new Date().toISOString() };
  localStorage.setItem(storageKey(), JSON.stringify(state));
}

export function resetFreeMeal() {
  localStorage.removeItem(storageKey());
}
