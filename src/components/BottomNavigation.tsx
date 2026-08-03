import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  CalendarDays,
  NotebookPen,
  TrendingUp,
  Plus,
} from "lucide-react";

import ActivityLogModal from "@/components/progress/ActivityLogModal";
import { logGlass } from "@/utils/waterEngine";
import { logActivityCalories } from "@/utils/activityLogEngine";

// Bar height (h-17 = 68px) and the radius of the quick-add bump that rises
// out of its top edge. Both feed the single silhouette path below, so they
// have to stay in sync with the nav's Tailwind height class.
const BAR_HEIGHT = 68;
const BUMP_RADIUS = 28;

/**
 * One continuous outline for the bar *and* the quick-add bump, drawn as a
 * pill unioned with a semicircle centred on its top edge.
 *
 * Previously these were two separate .glass-panel elements stacked on top
 * of each other, and each drew its own hairline rim — so the bar's rim ran
 * straight through the circle and the circle's rim closed underneath it,
 * which read as a disc floating over the bar rather than part of it. A
 * single path has no interior seams to give away.
 */
function barSilhouettePath(width: number): string {
  const r = BAR_HEIGHT / 2;
  const top = BUMP_RADIUS;
  const bottom = BUMP_RADIUS + BAR_HEIGHT;
  const mid = width / 2;

  return [
    `M ${r} ${top}`,
    `L ${mid - BUMP_RADIUS} ${top}`,
    // Sweep 1 bulges upward to y=0 — the exposed half of the bump.
    `A ${BUMP_RADIUS} ${BUMP_RADIUS} 0 0 1 ${mid + BUMP_RADIUS} ${top}`,
    `L ${width - r} ${top}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${bottom}`,
    `L ${r} ${bottom}`,
    `A ${r} ${r} 0 0 1 ${r} ${top}`,
    "Z",
  ].join(" ");
}

const items = [
  {
    to: "/",
    label: "خانه",
    icon: Home,
  },
  {
    to: "/daily-program",
    label: "برنامه روزانه",
    icon: CalendarDays,
  },
  {
    to: "/daily-log",
    label: "ثبت روزانه",
    icon: NotebookPen,
  },
  {
    to: "/progress",
    label: "پیشرفت",
    icon: TrendingUp,
  },
];

export default function BottomNavigation() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  // The silhouette path is in real pixels (so the bump stays a true
  // circle), which means it has to be rebuilt whenever the bar's width
  // changes — rotation, split view, anything.
  const barRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(0);

  useLayoutEffect(() => {
    function measure() {
      setBarWidth(barRef.current?.getBoundingClientRect().width ?? 0);
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (barRef.current) observer.observe(barRef.current);

    return () => observer.disconnect();
  }, []);

  // Same four domains as ProgressPage's stat cards, same emoji per domain —
  // this is just a faster on-ramp into each one's existing log flow, not a
  // new logging path. Water logs immediately (no value worth typing in, same
  // as WaterDetailPage's own "+"); the rest hand off to their real flow.
  const quickActions = [
    {
      label: "افزودن غذا",
      icon: "🍽️",
      onSelect: () => navigate("/daily-log"),
    },
    {
      label: "ثبت وزن",
      icon: "⚖️",
      onSelect: () => navigate("/settings/weight"),
    },
    {
      label: "ثبت آب",
      icon: "💧",
      onSelect: () => {
        logGlass();
        navigate("/progress/water");
      },
    },
    {
      label: "ثبت فعالیت",
      icon: "🔥",
      onSelect: () => setActivityModalOpen(true),
    },
  ];

  function handleQuickAction(onSelect: () => void) {
    setDrawerOpen(false);
    onSelect();
  }

  return (
    <>
      {/* Same blurred-backdrop treatment as ModalOverlay (and the same iOS
          Safari backdrop-filter-on-fixed-elements bug mitigation: forcing a
          GPU layer via translateZ(0)) so the drawer stays legible over
          whatever page content sits behind it, and tapping outside closes
          it like every other overlay in the app. */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="quick-add-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-30 backdrop-blur-[15px]"
            style={{ transform: "translateZ(0)", willChange: "backdrop-filter" }}
          />
        )}
      </AnimatePresence>

      <div
        className="pointer-events-none fixed inset-x-0 z-40"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
      >
        <div className="pointer-events-auto mx-auto max-w-md px-5.25">
          <div className="relative">
            {/* Grows upward from the seam where the toggle button sits,
                bottom edge pinned to the nav pill's top edge (bottom-full)
                so animating height alone produces the "rises from behind
                the button" motion — no separate slide transform needed. */}
            <AnimatePresence>
              {drawerOpen && (
                <motion.div
                  key="quick-add-drawer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  // .glass-panel sets position: relative in index.css, which
                  // (same specificity, later in source order) beats the
                  // "absolute" utility class — an explicit inline style is
                  // needed to actually win the cascade.
                  style={{ position: "absolute" }}
                  className="glass-panel inset-x-0 bottom-full z-10 overflow-hidden rounded-3xl"
                >
                  <div className="grid grid-cols-2 gap-3 p-4 pb-9">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.onSelect)}
                        className="glass-chip flex flex-col items-center gap-2 rounded-2xl py-4 text-sm font-medium text-white"
                      >
                        <span className="text-2xl">{action.icon}</span>
                        {action.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bar + bump as one shape, above the drawer so the bump reads
                as part of the bar rather than something the drawer slides
                over. The glass surface and hairline come from the SVG path
                (matching .glass-panel's own background/rim values), not
                from .glass-panel itself — two overlapping .glass-panel
                elements each drew their own rim, which is exactly what
                made the bump look detached. */}
            <div ref={barRef} className="relative z-20">
              {barWidth > 0 && (
                <svg
                  aria-hidden="true"
                  width={barWidth}
                  height={BAR_HEIGHT + BUMP_RADIUS}
                  viewBox={`0 0 ${barWidth} ${BAR_HEIGHT + BUMP_RADIUS}`}
                  // overflow visible so the 1px stroke isn't clipped at the
                  // silhouette's extremes; drop-shadow follows the path's
                  // alpha, so the bump gets the same lift as the bar.
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    overflow: "visible",
                    filter: "drop-shadow(0 8px 16px rgb(0 0 0 / 40%))",
                  }}
                >
                  <path
                    d={barSilhouettePath(barWidth)}
                    fill="rgb(0 0 0 / 10%)"
                    stroke="rgb(219 219 219 / 30%)"
                    strokeWidth={1}
                  />
                </svg>
              )}

              {/* Centred on the bar's top edge, inside the bump the path
                  above already draws — this button carries only the icon
                  and the hit area now, no surface of its own. */}
              <button
                onClick={() => setDrawerOpen((open) => !open)}
                aria-label={drawerOpen ? "بستن ثبت سریع" : "ثبت سریع"}
                style={{ position: "absolute", height: BUMP_RADIUS * 2, width: BUMP_RADIUS * 2 }}
                className="left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white transition-transform duration-150 active:scale-90 [-webkit-tap-highlight-color:transparent] touch-manipulation"
              >
                <motion.span
                  animate={{ rotate: drawerOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  // Nudged into the exposed upper half of the bump so it
                  // doesn't straddle the bar's top edge.
                  className="flex -translate-y-3"
                >
                  <Plus size={26} />
                </motion.span>
              </button>

              {/* Tab selection is ported from Figma's "Tab Bar - iPhone"
                  component (node 38:906, Apple's own iOS tab-bar pattern —
                  https://developer.apple.com/design/human-interface-guidelines/tab-bars):
                  each tab gets a sliding "Selection" pill behind it when
                  active, via a shared framer-motion layoutId — the defining
                  trait of an iOS tab bar (it glides between tabs on switch
                  instead of just appearing). */}
              <nav className="relative flex h-17 items-center justify-around overflow-hidden rounded-full">
                {items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setDrawerOpen(false)}
                      className="relative z-10 flex h-full flex-1 items-center justify-center [-webkit-tap-highlight-color:transparent] touch-manipulation"
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.div
                              layoutId="bottom-nav-selection"
                              className="absolute inset-1 rounded-full bg-white/10"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 32,
                              }}
                            />
                          )}

                          <span
                            className={`relative flex flex-col items-center gap-1 text-xs transition-[color,transform] duration-150 active:scale-95 ${
                              isActive ? "text-avocado-yellow" : "text-white"
                            }`}
                          >
                            <Icon size={22} />
                            <span>{item.label}</span>
                          </span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <ActivityLogModal
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        onLog={(calories) => {
          logActivityCalories(calories);
          navigate("/progress/activity");
        }}
      />
    </>
  );
}
