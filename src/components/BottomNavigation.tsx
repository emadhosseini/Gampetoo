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
import WeightModal from "@/components/WeightModal";
import WaterLogModal from "@/components/WaterLogModal";
import { useQuickAddMealFlow } from "@/hooks/useQuickAddMealFlow";
import { logGlasses } from "@/utils/waterEngine";
import { logActivityEntry } from "@/utils/activityLogEngine";

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

// A flat bathroom-scale pictogram for the "ثبت وزن" quick action — the
// balance-scale emoji it replaced (⚖️) reads as a courtroom/justice scale,
// not a bodyweight scale, so it didn't fit the actual feature. A light
// rounded-square body with a small dark display near the top mirrors an
// actual digital bathroom scale's silhouette instead.
function ScaleIcon() {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28" aria-hidden="true">
      <rect x="2" y="2" width="32" height="32" rx="10" fill="#e4e4e7" />
      <rect x="11" y="9" width="14" height="7" rx="2.5" fill="#18181b" />
    </svg>
  );
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

export interface BottomNavigationProps {
  // Fires whenever the quick-add drawer opens/closes so Layout can blur
  // the page content behind it (a real CSS filter on <main>, applied by
  // Layout since <main> is this component's sibling, not its child).
  onDrawerOpenChange?: (open: boolean) => void;
}

export default function BottomNavigation({
  onDrawerOpenChange,
}: BottomNavigationProps) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpenState] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [waterModalOpen, setWaterModalOpen] = useState(false);
  // The quick-add shortcut's own food-logging flow — shared with the "+" on
  // the calories detail page, so the two behave identically by construction
  // rather than by two copies happening to agree.
  const { openFoodFlow, foodFlowModals } = useQuickAddMealFlow();

  function setDrawerOpen(open: boolean | ((prev: boolean) => boolean)) {
    setDrawerOpenState((prev) => {
      const next = typeof open === "function" ? open(prev) : open;

      if (next !== prev) onDrawerOpenChange?.(next);

      return next;
    });
  }

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
  // new logging path.
  const quickActions = [
    {
      label: "افزودن غذا",
      icon: "🍽️",
      onSelect: () => {
        openFoodFlow();
      },
    },
    {
      label: "ثبت وزن",
      icon: <ScaleIcon />,
      onSelect: () => setWeightModalOpen(true),
    },
    {
      label: "ثبت آب",
      icon: "💧",
      onSelect: () => setWaterModalOpen(true),
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
      {/* Invisible tap-catcher only — no backdrop-filter here anymore. The
          blur behind the open drawer is a real CSS filter that Layout puts
          on <main> (via onDrawerOpenChange): backdrop-filter on this fixed
          layer rendered or silently didn't depending on whether the
          SideMenu wrapper happened to be carrying a transform at that
          moment (WebKit changes what a backdrop-filter may sample under a
          transformed ancestor), which is exactly the "sometimes blurred,
          sometimes not" bug. A plain filter on the content itself has no
          such dependency — it always renders. */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30"
        />
      )}

      <div
        className="pointer-events-none fixed inset-x-0 z-40"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
      >
        <div className="pointer-events-auto mx-auto max-w-md px-5.25">
          <div className="relative">
            {/* Grows upward from directly behind the nav pill — bottom edge
                pinned 2px below the pill's own bottom edge (rather than at
                its top, where the bump would leave a gap showing the pill
                underneath) so animating height alone produces a "rises from
                behind the bar" motion with no visible seam: the pill sits
                at z-20, above this drawer's z-10, so the 2px overlap tucks
                cleanly out of sight instead of poking past the pill's edge. */}
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
                  // needed to actually win the cascade. Bottom corners are
                  // set to the pill's own radius (BAR_HEIGHT / 2) rather than
                  // Tailwind's rounded-3xl, so where the drawer overlaps the
                  // bar underneath (see the -2px anchor) the two curves are
                  // literally the same one instead of a tighter corner
                  // sitting inside a wider pill end.
                  style={{
                    position: "absolute",
                    bottom: -2,
                    borderBottomLeftRadius: BAR_HEIGHT / 2,
                    borderBottomRightRadius: BAR_HEIGHT / 2,
                  }}
                  className="glass-panel inset-x-0 z-10 overflow-hidden rounded-t-3xl"
                >
                  {/* The panel's own box now reaches all the way down past
                      the pill (see the bottom: -2 anchor above), but the
                      actual buttons still need to stay clear of the pill's
                      clickable nav area sitting on top of them at z-20 — so
                      this bottom padding grows by exactly the same amount
                      the anchor moved (the pill's full height, 68px, plus
                      the 2px overlap) to keep the grid's own bottom edge at
                      the same spot it always was, just with more (blank,
                      now-hidden-behind-the-pill) card below it. */}
                  <div className="grid grid-cols-2 gap-3 p-4 pb-26.5">
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
                className="left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white [-webkit-tap-highlight-color:transparent] touch-manipulation"
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

      <WeightModal
        open={weightModalOpen}
        onClose={() => setWeightModalOpen(false)}
        onSaved={() => navigate("/progress/weight")}
      />

      <ActivityLogModal
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        onLog={(calories, note) => {
          logActivityEntry(calories, note);
          navigate("/progress/activity");
        }}
      />

      <WaterLogModal
        open={waterModalOpen}
        onClose={() => setWaterModalOpen(false)}
        onLog={(glasses) => {
          logGlasses(glasses);
          // No standalone water page anymore — today's count now lives in
          // the "آب" row on ProgressPage's dashboard card.
          navigate("/progress");
        }}
      />

      {foodFlowModals}
    </>
  );
}
