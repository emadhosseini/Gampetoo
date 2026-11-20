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
import { hapticLight } from "@/native/haptics";
import { isNativeIos } from "@/native/platform";
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
  const nativeIos = isNativeIos();

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
      const computed = Math.round(width * DRAWER_FRACTION);
      setDrawerWidth(nativeIos ? Math.min(computed, 320) : computed);
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [nativeIos]);

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

    if (nativeIos) {
      animate(openPx, target, {
        type: "spring",
        stiffness: 360,
        damping: 34,
        mass: 0.9,
        onComplete: () => {
          if (!nextOpen) setFilterActive(false);
        },
      });
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

  const asideX = useTransform(
    openPx,
    [0, drawerWidth || 1],
    [drawerWidth, 0],
  );
  const contentBlurPx = useTransform(
    openPx,
    [0, drawerWidth || 1],
    [0, nativeIos ? 7 : CONTENT_BLUR_MAX_PX],
  );
  const contentScale = useTransform(openPx, [0, drawerWidth || 1], [1, 0.95]);
  const contentRadius = useTransform(openPx, [0, drawerWidth || 1], [0, 28]);
  const contentFilter = useMotionTemplate`blur(${contentBlurPx}px)`;

  return (
    <div ref={containerRef} className="relative h-full overflow-x-hidden">
      <motion.div
        style={{
          filter:
            !prefersReducedMotion && filterActive ? contentFilter : undefined,
          scale:
            nativeIos && !prefersReducedMotion && filterActive
              ? contentScale
              : undefined,
          borderRadius:
            nativeIos && !prefersReducedMotion && filterActive
              ? contentRadius
              : undefined,
          overflow:
            nativeIos && !prefersReducedMotion && filterActive
              ? "hidden"
              : undefined,
        }}
        className="relative z-10 h-full"
      >
        {children}
      </motion.div>

      <div
        className={`absolute inset-0 z-40 transition-colors duration-200 ${
          open
            ? nativeIos
              ? "pointer-events-auto bg-black/30"
              : "pointer-events-auto"
            : "pointer-events-none"
        }`}
        aria-hidden={!open}
        onClick={() => snapTo(false)}
      />

      {nativeIos ? (
        <motion.aside
          style={{
            x: asideX,
            width: drawerWidth || `${DRAWER_FRACTION * 100}%`,
          }}
          className="ios-glass-sidebar absolute inset-y-0 right-0 z-50 touch-none overflow-hidden rounded-l-[34px]"
          aria-hidden={!open}
          {...dragHandlers}
        >
          <div
            className="relative flex h-full flex-col overflow-y-auto px-4"
            style={{
              paddingTop: "calc(env(safe-area-inset-top) + 12px)",
              paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            }}
          >
            <div className="flex-1 space-y-4">
              <button
                onClick={() => {
                  hapticLight();
                  goTo("/profile");
                }}
                aria-label="رفتن به پروفایل"
                className="ios-inset-group flex w-full items-center justify-between rounded-[24px] p-4 transition-transform active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-1 ring-white/20">
                    <img
                      src={avatarCharacterIcon(getCurrentUserGender())}
                      alt=""
                      aria-hidden="true"
                      width={48}
                      height={48}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-white">{userName}</p>
                    <p className="text-xs text-white/55">مشاهده پروفایل</p>
                  </div>
                </div>
                <ChevronLeft size={18} className="text-white/50" />
              </button>

              <div>
                <p className="mb-1.5 px-3 text-[11px] font-semibold text-white/45">
                  برنامه‌ریزی
                </p>
                <div className="ios-inset-group overflow-hidden rounded-[24px] divide-y divide-white/8">
                  <div>
                    <button
                      onClick={() => {
                        hapticLight();
                        setTrainingOpen((prev) => !prev);
                      }}
                      aria-expanded={trainingOpen}
                      className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors active:bg-white/6"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-avocado-lime/20 text-avocado-lime">
                        <Dumbbell size={16} />
                      </div>
                      <span className="flex-1 text-right text-sm font-semibold text-white">
                        برنامه‌ریزی تمرینی
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-white/50 transition-transform duration-200 ${
                          trainingOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {trainingOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 34 }}
                          className="overflow-hidden border-t border-white/6 bg-black/15"
                        >
                          <div className="divide-y divide-white/6">
                            {trainingLinks.map((item) => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.to}
                                  onClick={() => {
                                    hapticLight();
                                    goTo(item.to);
                                  }}
                                  className="flex w-full items-center gap-3 py-3 pe-4 ps-12 transition-colors active:bg-white/6"
                                >
                                  <Icon size={15} className="text-white/60" />
                                  <span className="flex-1 text-right text-xs font-medium text-white/90">
                                    {item.label}
                                  </span>
                                  <ChevronLeft size={14} className="text-white/35" />
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {menuLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.to}
                        onClick={() => {
                          hapticLight();
                          goTo(item.to);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors active:bg-white/6"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-avocado-yellow/18 text-avocado-yellow">
                          <Icon size={16} />
                        </div>
                        <span className="flex-1 text-right text-sm font-semibold text-white">
                          {item.label}
                        </span>
                        <ChevronLeft size={16} className="text-white/50" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <SettingsButton
                onClick={() => {
                  hapticLight();
                  setSettingsOpen(true);
                }}
              />
              <span
                dir="ltr"
                className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-medium text-white/45"
              >
                v{__APP_VERSION__}
              </span>
            </div>
          </div>
        </motion.aside>
      ) : (
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
                <button
                  onClick={() => goTo("/profile")}
                  aria-label="رفتن به پروفایل"
                  className="glass-panel flex w-full items-center justify-between rounded-3xl p-7"
                >
                  <div className="flex items-center gap-3">
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

              <div className="flex justify-start pt-3">
                <SettingsButton onClick={() => setSettingsOpen(true)} />
              </div>

              <p dir="ltr" className="pt-4 text-center text-xs text-white/40">
                {__APP_VERSION__}
              </p>
            </div>
          </div>
        </motion.aside>
      )}


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
              onClick={() => {
                hapticLight();
                snapTo(true);
              }}
              aria-label="باز کردن منو"
              className={`absolute right-4 flex items-center justify-center rounded-full ${
                nativeIos ? "ios-glass-orb h-11 w-11" : "glass-chip h-10 w-10"
              }`}
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
