import { Menu } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

const DRAWER_FRACTION = 2 / 3;
// A thin strip along the right edge that can start an open-swipe even while
// the drawer is closed (it's off-screen then, so nothing else is there to
// grab).
const EDGE_TRIGGER_WIDTH = 24;
// Releasing past this fraction of the drawer's width snaps open; short of
// it snaps back closed — same threshold pattern as the slide-to-complete
// button.
const OPEN_THRESHOLD = 0.4;
// A drag that starts from fully-open and moves left by at least this many
// px closes the drawer — dragging left on the open menu can't visually
// reveal any more of it (already maxed out), so that intent has to be read
// from the gesture directly rather than from where openPx ends up.
const CLOSE_DRAG_DISTANCE = 60;
// How dark the backdrop over the rest of the page gets at fully open.
const BACKDROP_MAX_OPACITY = 0.55;

interface SideMenuProps {
  children: ReactNode;
}

export default function SideMenu({ children }: SideMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawerWidth, setDrawerWidth] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // How far (in px) the drawer has entered from the right: 0 = fully closed
  // (off-screen), drawerWidth = fully open.
  const openPx = useMotionValue(0);
  const dragState = useRef<{ startX: number; startOpenPx: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    function measure() {
      const width = containerRef.current?.getBoundingClientRect().width ?? 0;
      setDrawerWidth(Math.round(width * DRAWER_FRACTION));
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Re-snaps (no animation) if the measured width changes while the drawer
  // is already settled — e.g. an orientation change. The actual open/close
  // transitions are triggered explicitly by snapTo() below instead of
  // reacting to `open` here, since a drag can release back into the same
  // `open` value it already had (a partial swipe that snaps back closed
  // while already closed) — React skips re-running an effect keyed on a
  // state value that didn't change, which left the drawer stranded
  // mid-drag when this used to be effect-driven.
  useEffect(() => {
    openPx.set(open ? drawerWidth : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerWidth]);

  function snapTo(nextOpen: boolean) {
    setOpen(nextOpen);

    const target = nextOpen ? drawerWidth : 0;

    if (prefersReducedMotion) {
      openPx.set(target);
      return;
    }

    // A plain ease-out tween (no spring) — no bounce/overshoot on either end.
    animate(openPx, target, { duration: 0.3, ease: "easeOut" });
  }

  function handlePointerDown(e: ReactPointerEvent) {
    dragState.current = { startX: e.clientX, startOpenPx: openPx.get() };
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent) {
    const state = dragState.current;
    if (!state || drawerWidth === 0) return;

    const deltaX = e.clientX - state.startX;
    // Dragging left (negative deltaX) reveals more of the drawer.
    const next = Math.min(
      drawerWidth,
      Math.max(0, state.startOpenPx - deltaX),
    );

    openPx.set(next);
  }

  function handlePointerUp(e: ReactPointerEvent) {
    const state = dragState.current;
    if (!state) return;
    dragState.current = null;

    const deltaX = e.clientX - state.startX;
    const startedFullyOpen = state.startOpenPx >= drawerWidth - 1;
    const draggedLeftToClose = startedFullyOpen && deltaX < -CLOSE_DRAG_DISTANCE;

    const progress = drawerWidth > 0 ? openPx.get() / drawerWidth : 0;
    snapTo(!draggedLeftToClose && progress >= OPEN_THRESHOLD);
  }

  const dragHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };

  const asideX = useTransform(openPx, (value) => drawerWidth - value);
  const contentX = useTransform(openPx, (value) => -value);
  const backdropOpacity = useTransform(
    openPx,
    [0, drawerWidth || 1],
    [0, BACKDROP_MAX_OPACITY],
  );

  return (
    <div ref={containerRef} className="relative h-full overflow-x-hidden">
      <motion.div style={{ x: contentX }} className="relative z-10 h-full">
        {children}

        <motion.div
          style={{ opacity: backdropOpacity }}
          className={`absolute inset-0 z-50 bg-black ${
            open ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-hidden={!open}
          onClick={() => snapTo(false)}
        />
      </motion.div>

      <motion.aside
        style={{ x: asideX, width: `${DRAWER_FRACTION * 100}%` }}
        className="absolute inset-y-0 right-0 z-20 touch-none"
        aria-hidden={!open}
        {...dragHandlers}
      >
        <div className="glass-panel glass-static h-full rounded-none border-y-0 border-l-0 px-5 pt-safe">
          <h2 className="pt-16 text-lg font-bold text-white">منو</h2>
        </div>
      </motion.aside>

      {!open && (
        <div
          className="fixed inset-y-0 right-0 z-30 touch-none"
          style={{ width: EDGE_TRIGGER_WIDTH }}
          {...dragHandlers}
        />
      )}

      {!open && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
          <div className="pointer-events-auto relative mx-auto max-w-md">
            <button
              onClick={() => snapTo(true)}
              aria-label="باز کردن منو"
              className="glass-chip absolute right-4 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
