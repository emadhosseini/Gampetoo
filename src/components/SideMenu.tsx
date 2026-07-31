import {
  ChevronLeft,
  ClipboardList,
  Dumbbell,
  Menu,
  User,
  UtensilsCrossed,
} from "lucide-react";
import {
  animate,
  motion,
  useMotionTemplate,
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
import { useNavigate } from "react-router-dom";

import { getCurrentUserName } from "@/utils/userEngine";

const menuLinks = [
  { to: "/settings/workouts", label: "کتابخانه تمرین‌ها", icon: Dumbbell },
  { to: "/settings/program", label: "برنامه تمرینی", icon: ClipboardList },
  { to: "/settings/nutrition", label: "برنامه غذایی", icon: UtensilsCrossed },
];

const DRAWER_FRACTION = 0.8;
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
// How blurred the page behind the menu gets at fully open — the menu now
// overlays the page (like a modal) instead of pushing it aside.
const CONTENT_BLUR_MAX_PX = 5;

interface SideMenuProps {
  children: ReactNode;
}

export default function SideMenu({ children }: SideMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawerWidth, setDrawerWidth] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const userName = getCurrentUserName() ?? "";

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

  function goTo(path: string) {
    navigate(path);
    snapTo(false);
  }

  const dragHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };

  const asideX = useTransform(openPx, (value) => drawerWidth - value);
  const backdropOpacity = useTransform(
    openPx,
    [0, drawerWidth || 1],
    [0, BACKDROP_MAX_OPACITY],
  );
  const contentBlurPx = useTransform(
    openPx,
    [0, drawerWidth || 1],
    [0, CONTENT_BLUR_MAX_PX],
  );
  const contentFilter = useMotionTemplate`blur(${contentBlurPx}px)`;

  return (
    <div ref={containerRef} className="relative h-full overflow-x-hidden">
      <motion.div
        style={{ filter: prefersReducedMotion ? undefined : contentFilter }}
        className="relative z-10 h-full"
      >
        {children}
      </motion.div>

      <motion.div
        style={{ opacity: backdropOpacity }}
        className={`absolute inset-0 z-40 bg-black ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
        onClick={() => snapTo(false)}
      />

      <motion.aside
        style={{
          x: asideX,
          width: `${DRAWER_FRACTION * 100}%`,
          boxShadow:
            "1.25px 0px 1px -0.75px rgba(219, 219, 219, 0.35), -1.25px 0px 1px -0.75px rgba(219, 219, 219, 0.35), 0px 0px 0.5px 0.5px rgba(219, 219, 219, 0.3), 0px 8px 48px 0px rgba(0, 0, 0, 0.25)",
        }}
        className="absolute inset-y-0 right-0 z-50 touch-none rounded-l-[34px]"
        aria-hidden={!open}
        {...dragHandlers}
      >
        {/* iOS-style glass fill, ported from the Figma Action Sheet component.
            Figma's own blend layers (white multiply + gray darken) are near
            no-ops over most backgrounds — multiply-by-white is a
            mathematical identity — so the real "glass" tint comes from an
            actual translucent veil here instead. A much stronger blur (40px,
            then 24px) was tried first and softened the page behind it more
            than intended; 5px is the tuned value — barely-there blur plus a
            near-invisible veil so the page behind stays legible through it. */}
        <div
          className="relative h-full overflow-hidden rounded-l-[34px]"
          style={{ backdropFilter: "blur(5px) saturate(160%)", WebkitBackdropFilter: "blur(5px) saturate(160%)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.01)",
              backgroundImage:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0) 65%)",
            }}
          />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow:
                "inset 0px 40px 10px -40px #282828, inset 0px -40px 10px -40px #282828",
            }}
          />

          <div
            className="relative h-full space-y-3 overflow-y-auto px-5 pb-6"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
          >
            {/* Profile row + the 3 menu rows below, ported from Figma
                (node-id=0-1's loose "Notification - Collapsed"/"Toolbar"
                instances) — same glass-panel treatment as every other card
                (index.css), 24px corners per that component's own radius.
                Top gap matches space-y-3 (the gap between rows) instead of
                being its own much larger, disproportionate margin. */}
            <div className="glass-panel flex items-center justify-between rounded-3xl p-7">
              <div className="flex items-center gap-3">
                {/* Placeholder avatar — swap for a gender-based picture later. */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-avocado-yellow/20 text-avocado-yellow">
                  <User size={20} />
                </div>

                <span className="font-semibold text-white">{userName}</span>
              </div>

              <button
                onClick={() => goTo("/profile")}
                aria-label="پروفایل"
                className="glass-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {menuLinks.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.to}
                  onClick={() => goTo(item.to)}
                  className="glass-panel flex w-full items-center gap-3 rounded-3xl p-4"
                >
                  <span className="flex-1 text-right font-semibold text-white">
                    {item.label}
                  </span>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Icon size={18} />
                  </div>
                </button>
              );
            })}
          </div>
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
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
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
