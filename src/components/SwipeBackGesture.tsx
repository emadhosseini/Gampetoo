import { ChevronRight } from "lucide-react";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { hapticLight } from "@/native/haptics";
import { navigateBackSafely } from "@/utils/navigationBack";

const ROOT_TAB_ROUTES = new Set(["/", "/daily-program", "/progress", "/daily-log"]);

const EDGE_STRIP_WIDTH = 28;
const LOCK_THRESHOLD = 10;
const TRIGGER_DISTANCE = 64;
const FAST_FLICK_DISTANCE = 36;
const FAST_FLICK_MAX_MS = 220;
const MAX_VISUAL_DRAG = 108;

/**
 * Left-edge swipe-to-go-back gesture for iOS & mobile subpages.
 * Kept strictly on the left edge so the right edge stays 100% dedicated to
 * SideMenu (and WKWebView's allowsBackForwardNavigationGestures stays off so
 * WebKit's right-edge forward gesture never hijacks the RTL drawer).
 */
export default function SwipeBackGesture() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [dragX, setDragX] = useState(0);

  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTime: number;
    locked: "horizontal" | "vertical" | null;
    crossedThreshold: boolean;
  } | null>(null);

  if (ROOT_TAB_ROUTES.has(pathname)) {
    return null;
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      locked: null,
      crossedThreshold: false,
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const state = gestureRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (state.locked === null) {
      if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
      if (dx <= 0 || Math.abs(dy) > Math.abs(dx) * 1.15) {
        state.locked = "vertical";
        return;
      }
      state.locked = "horizontal";
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if capture is unavailable.
      }
    }

    if (state.locked !== "horizontal") return;

    const clamped = Math.max(0, Math.min(MAX_VISUAL_DRAG, dx));
    setDragX(clamped);

    if (!state.crossedThreshold && clamped >= TRIGGER_DISTANCE) {
      state.crossedThreshold = true;
      hapticLight();
    } else if (state.crossedThreshold && clamped < TRIGGER_DISTANCE - 12) {
      state.crossedThreshold = false;
    }
  }

  function finishGesture(e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) {
    const state = gestureRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    gestureRef.current = null;

    const dx = Math.max(0, e.clientX - state.startX);
    const elapsed = Date.now() - state.startTime;
    const shouldTrigger =
      !cancelled &&
      state.locked === "horizontal" &&
      (dx >= TRIGGER_DISTANCE || (dx >= FAST_FLICK_DISTANCE && elapsed <= FAST_FLICK_MAX_MS));

    setDragX(0);

    if (shouldTrigger) {
      if (!state.crossedThreshold) {
        hapticLight();
      }
      navigateBackSafely(navigate, pathname);
    }
  }

  const ready = dragX >= TRIGGER_DISTANCE;
  const progress = Math.min(1, dragX / TRIGGER_DISTANCE);

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-y-0 left-0 z-30 touch-none"
        style={{ width: EDGE_STRIP_WIDTH }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => finishGesture(e, false)}
        onPointerCancel={(e) => finishGesture(e, true)}
      />

      {dragX > 6 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-1/2 z-50 -translate-y-1/2"
          style={{
            transform: `translate3d(${Math.round(dragX * 0.38) - 18}px, -50%, 0) scale(${0.82 + progress * 0.2})`,
            opacity: Math.min(1, progress * 1.15),
          }}
        >
          <div
            className={`glass-chip glass-static flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-colors ${
              ready
                ? "border-avocado-lime/60 bg-avocado-lime/25 text-avocado-lime"
                : "border-white/25 text-white"
            }`}
          >
            <ChevronRight size={20} />
          </div>
        </div>
      )}
    </>
  );
}
