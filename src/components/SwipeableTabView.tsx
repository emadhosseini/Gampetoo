import { AnimatePresence, motion } from "framer-motion";
import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { hapticSelection } from "@/native/haptics";

const EDGE_GUARD_PX = 28;
const LOCK_THRESHOLD_PX = 12;
const TRIGGER_DISTANCE_PX = 54;
const FAST_FLICK_DISTANCE_PX = 28;
const FAST_FLICK_MAX_MS = 240;

export interface SwipeableTabViewProps<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (next: T) => void;
  children: ReactNode;
}

/**
 * Lets the user swipe left/right in the middle of the screen to switch between
 * sibling tabs (e.g. وعده غذایی ↔ برنامه غذایی, or برنامه تمرینی ↔ فعالیت).
 *
 * - Leaves 28px strips on both left & right edges completely untouched so
 *   SideMenu (right edge) and SwipeBackGesture (left edge) keep working.
 * - Ignores touches originating on text inputs or `[data-no-tab-swipe="true"]`
 *   controls (like SlideToCompleteButton or horizontal pickers).
 * - Strictly locks to horizontal intent (`|dx| > |dy| * 1.35`) so normal
 *   vertical scrolling never stutters.
 */
export default function SwipeableTabView<T extends string>({
  tabs,
  active,
  onChange,
  children,
}: SwipeableTabViewProps<T>) {
  const activeIndex = Math.max(0, tabs.indexOf(active));
  const [dragOffset, setDragOffset] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const prevIndexRef = useRef(activeIndex);

  if (prevIndexRef.current !== activeIndex) {
    setSlideDir(activeIndex > prevIndexRef.current ? 1 : -1);
    prevIndexRef.current = activeIndex;
  }

  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTime: number;
    locked: "horizontal" | "vertical" | null;
    isRtl: boolean;
  } | null>(null);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (tabs.length < 2) return;

    const viewportW = window.innerWidth;
    if (e.clientX <= EDGE_GUARD_PX || e.clientX >= viewportW - EDGE_GUARD_PX) {
      return;
    }

    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'input, textarea, select, [contenteditable="true"], [data-no-tab-swipe="true"]',
      )
    ) {
      return;
    }

    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      locked: null,
      isRtl: document.documentElement.dir !== "ltr",
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const state = gestureRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (state.locked === null) {
      if (Math.abs(dx) < LOCK_THRESHOLD_PX && Math.abs(dy) < LOCK_THRESHOLD_PX) {
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) * 1.35) {
        state.locked = "horizontal";
      } else {
        state.locked = "vertical";
        return;
      }
    }

    if (state.locked !== "horizontal") return;

    // In RTL, tabs flow right-to-left: dragging finger right (+dx) reveals the
    // next tab (to the left); dragging left (-dx) returns to the previous tab.
    const stepDelta = state.isRtl ? (dx > 0 ? 1 : -1) : dx < 0 ? 1 : -1;
    const targetIdx = activeIndex + stepDelta;
    const hasTarget = targetIdx >= 0 && targetIdx < tabs.length;

    const damped = hasTarget ? dx * 0.42 : dx * 0.14;
    setDragOffset(Math.max(-96, Math.min(96, damped)));
  }

  function finishGesture(e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) {
    const state = gestureRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    gestureRef.current = null;

    const dx = e.clientX - state.startX;
    const elapsed = Date.now() - state.startTime;
    const absDx = Math.abs(dx);
    const shouldSwitch =
      !cancelled &&
      state.locked === "horizontal" &&
      (absDx >= TRIGGER_DISTANCE_PX ||
        (absDx >= FAST_FLICK_DISTANCE_PX && elapsed <= FAST_FLICK_MAX_MS));

    setDragOffset(0);

    if (!shouldSwitch) return;

    const stepDelta = state.isRtl ? (dx > 0 ? 1 : -1) : dx < 0 ? 1 : -1;
    const nextIdx = activeIndex + stepDelta;
    if (nextIdx >= 0 && nextIdx < tabs.length) {
      setSlideDir(stepDelta as 1 | -1);
      prevIndexRef.current = nextIdx;
      hapticSelection();
      onChange(tabs[nextIdx]);
    }
  }

  const isRtl =
    typeof document !== "undefined" ? document.documentElement.dir !== "ltr" : true;
  // In RTL, advancing to next tab (leftward tab) slides content in from the left (-x).
  const enterX = (isRtl ? -1 : 1) * slideDir * 28;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => finishGesture(e, false)}
      onPointerCancel={(e) => finishGesture(e, true)}
      className="min-h-[65vh] touch-pan-y"
      style={
        dragOffset !== 0
          ? {
              transform: `translate3d(${dragOffset}px, 0, 0)`,
              transition: "none",
            }
          : {
              transform: "translate3d(0, 0, 0)",
              transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
            }
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0.65, x: enterX }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0.65, x: -enterX * 0.5 }}
          transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.72 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
