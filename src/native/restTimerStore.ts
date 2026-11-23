export const REST_TIMER_EVENT = "gampetoo:rest-timer-changed";

export interface ActiveRestTimer {
  exerciseId?: string;
  exerciseName: string;
  endAt: number;
  totalSeconds: number;
}

let activeTimer: ActiveRestTimer | null = null;

export function getActiveRestTimer(): ActiveRestTimer | null {
  if (!activeTimer) return null;
  if (activeTimer.endAt <= Date.now()) {
    activeTimer = null;
    return null;
  }
  return activeTimer;
}

export function setActiveRestTimer(next: ActiveRestTimer | null): void {
  activeTimer = next && next.endAt > Date.now() ? next : null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(REST_TIMER_EVENT));
  }
}
