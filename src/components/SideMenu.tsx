import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Dumbbell,
  Menu,
  UtensilsCrossed,
} from "lucide-react";
import {
  AnimatePresence,
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
import { useLocation, useNavigate } from "react-router-dom";

import SettingsButton from "@/components/settings/SettingsButton";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import { avatarCharacterIcon } from "@/data/characterIcons";
import { getCurrentUserGender, getCurrentUserName } from "@/utils/userEngine";

// The two training screens are one job split in two — building the
// exercises and scheduling them — so they sit under one heading instead of
// competing as siblings with the nutrition plan.
const trainingLinks = [
  { to: "/settings/workouts", label: "کتابخانه تمرین‌ها", icon: Dumbbell },
  { to: "/settings/program", label: "تقویم تمرینی", icon: CalendarDays },
];

const menuLinks = [
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
// The drag handlers below sit on the whole panel (so the menu can be closed
// by dragging from anywhere on it, not just a dedicated handle), which means
// every tap on every button inside it also starts a "potential drag". A
// plain tap must NOT be captured as a drag, or it can swallow the button's
// native click before it fires — so pointer capture (and the open/close
// tracking) is deferred until the finger has actually moved past this many
// px, distinguishing a real drag from a tap/click.
const DRAG_START_THRESHOLD = 8;
// How blurred the page behind the menu gets at fully open — the menu now
// overlays the page (like a modal) instead of pushing it aside. No darkening
// tint on top, matching every other popup in the app (see ModalOverlay):
// blur alone does the visual separation.
const CONTENT_BLUR_MAX_PX = 5;

interface SideMenuProps {
  children: ReactNode;
}

export default function SideMenu({ children }: SideMenuProps) {
  const [open, setOpen] = useState(false);
  // Any non-"none" CSS `filter` on an ancestor — even a visually-inert
  // blur(0px) — makes that ancestor a containing block for `position:
  // fixed` descendants (a CSS footgun), which breaks every full-screen
  // modal any page renders (its "fixed inset-0" stops tracking the real
  // viewport once the page scrolls). So the blur filter below is only
  // ever applied while the drawer is actually opening/open/closing —
  // removed entirely (not just zeroed) the rest of the time, which is
  // the vast majority of normal app usage.
  const [filterActive, setFilterActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawerWidth, setDrawerWidth] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHomePage = pathname === "/";
  const userName = getCurrentUserName() ?? "";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);

  // How far (in px) the drawer has entered from the right: 0 = fully closed
  // (off-screen), drawerWidth = fully open.
  const openPx = useMotionValue(0);
  const dragState = useRef<{
    startX: number;
    startOpenPx: number;
    dragging: boolean;
  } | null>(null);

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
    setFilterActive(true);

    const target = nextOpen ? drawerWidth : 0;

    if (prefersReducedMotion) {
      openPx.set(target);
      if (!nextOpen) setFilterActive(false);
      return;
    }

    // A plain ease-out tween (no spring) — no bounce/overshoot on either
    // end. filterActive only turns back off once a close animation has
    // actually finished, so the blur still fades smoothly through it.
    animate(openPx, target, {
      duration: 0.3,
      ease: "easeOut",
      onComplete: () => {
        if (!nextOpen) setFilterActive(false);
      },
    });
  }

  function handlePointerDown(e: ReactPointerEvent) {
    // Pointer capture is intentionally NOT taken here yet — see
    // DRAG_START_THRESHOLD. Grabbing it immediately on every pointerdown
    // (including ones that land on a button) risks the browser routing the
    // eventual click to whatever this ends up capturing instead of firing
    // it on the button normally.
    dragState.current = {
      startX: e.clientX,
      startOpenPx: openPx.get(),
      dragging: false,
    };
  }

  function handlePointerMove(e: ReactPointerEvent) {
    const state = dragState.current;
    if (!state || drawerWidth === 0) return;

    const deltaX = e.clientX - state.startX;

    if (!state.dragging) {
      if (Math.abs(deltaX) < DRAG_START_THRESHOLD) return;

      state.dragging = true;
      setFilterActive(true);
      (e.target as Element).setPointerCapture(e.pointerId);
    }

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

    // No real drag happened — this was a plain tap/click, so leave it to
    // whatever element the pointer actually landed on (its own onClick).
    if (!state.dragging) return;

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
  const contentBlurPx = useTransform(
    openPx,
    [0, drawerWidth || 1],
    [0, CONTENT_BLUR_MAX_PX],
  );
  const contentFilter = useMotionTemplate`blur(${contentBlurPx}px)`;

  return (
    <div ref={containerRef} className="relative h-full overflow-x-hidden">
      <motion.div
        style={{
          filter:
            !prefersReducedMotion && filterActive ? contentFilter : undefined,
        }}
        className="relative z-10 h-full"
      >
        {children}
      </motion.div>

      <div
        className={`absolute inset-0 z-40 ${
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
        {/* Same fill as every popup/card in the app (.glass-panel's flat
            rgb(0 0 0 / 10%) tint, no saturate boost) instead of the old
            iOS-Action-Sheet recipe (a lighter white veil + saturate(160%))
            that made this drawer read as a visibly different, more vividly
            green surface than everything else. The blur still has to live
            here rather than on a separate backdrop layer like ModalOverlay
            — the drawer covers the page itself rather than sitting over a
            dedicated full-screen scrim — but now matches ModalOverlay's own
            25px so the two feel like the same material. */}
        <div
          className="relative h-full overflow-hidden rounded-l-[34px]"
          style={{
            backgroundColor: "rgb(0 0 0 / 10%)",
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
          }}
        >
          <div
            className="relative flex h-full flex-col overflow-y-auto px-5 pb-6"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex-1 space-y-3">
              {/* Profile row + the 3 menu rows below, ported from Figma
                  (node-id=0-1's loose "Notification - Collapsed"/"Toolbar"
                  instances) — same glass-panel treatment as every other card
                  (index.css), 24px corners per that component's own radius.
                  Top gap matches space-y-3 (the gap between rows) instead of
                  being its own much larger, disproportionate margin. */}
              <button
                onClick={() => goTo("/profile")}
                aria-label="رفتن به پروفایل"
                className="glass-panel flex w-full items-center justify-between rounded-3xl p-7"
              >
                <div className="flex items-center gap-3">
                  {/* Same avatar the profile page shows: the neutral
                      portrait until a gender is picked, then that gender's.
                      Read live from userEngine, so it follows a change made
                      in the account popup without anything to invalidate. */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden glass-chip rounded-full">
                    <img
                      src={avatarCharacterIcon(getCurrentUserGender())}
                      alt=""
                      aria-hidden="true"
                      width={44}
                      height={44}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <span className="font-semibold text-white">{userName}</span>
                </div>

                <div
                  aria-hidden="true"
                  className="glass-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl"
                >
                  <ChevronLeft size={20} />
                </div>
              </button>

              {/* Collapsed by default: the drawer's job is getting
                  somewhere fast, and two rarely-used screens shouldn't
                  cost two permanent rows. */}
              <button
                onClick={() => setTrainingOpen((prev) => !prev)}
                aria-expanded={trainingOpen}
                className="glass-panel flex w-full items-center gap-3 rounded-3xl p-4"
              >
                <span className="flex-1 text-right font-semibold text-white">
                  برنامه‌ریزی تمرینی
                </span>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${trainingOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {trainingOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    className="-mx-1 overflow-hidden px-1"
                  >
                    <div className="space-y-2 ps-4">
                      {trainingLinks.map((item) => {
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.to}
                            onClick={() => goTo(item.to)}
                            className="glass-chip glass-static flex w-full items-center gap-3 rounded-2xl p-3"
                          >
                            <span className="flex-1 text-right text-sm font-medium text-white">
                              {item.label}
                            </span>

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                              <Icon size={16} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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

            {/* Moved down from the top of the drawer — a settings gear
                reads as a low-priority, "if you need it" action, so it
                sits at the bottom near the version number rather than
                above the profile row where it competed for attention. */}
            <div className="flex justify-start pt-3">
              <SettingsButton onClick={() => setSettingsOpen(true)} />
            </div>

            <p dir="ltr" className="pt-4 text-center text-xs text-white/40">
              {__APP_VERSION__}
            </p>
          </div>
        </div>
      </motion.aside>


      <SettingsSidebar open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {!open && (
        <div
          className="fixed inset-y-0 right-0 z-30 touch-none"
          style={{ width: EDGE_TRIGGER_WIDTH }}
          {...dragHandlers}
        />
      )}

      {/* The visible hamburger button only makes sense as a persistent
          entry point on the home page — every other page can still open
          the menu via the edge-swipe strip above, which stays mounted
          regardless of this. */}
      {!open && isHomePage && (
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
