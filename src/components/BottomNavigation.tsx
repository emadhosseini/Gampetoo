import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  CalendarDays,
  Dumbbell,
  NotebookPen,
  TrendingUp,
  UtensilsCrossed,
  Plus,
} from "lucide-react";

import IosLiquidBubbleBar from "@/components/IosLiquidBubbleBar";
import ActivityLogModal from "@/components/progress/ActivityLogModal";
import WeightModal from "@/components/WeightModal";
import WaterLogModal from "@/components/WaterLogModal";
import { useQuickAddMealFlow } from "@/hooks/useQuickAddMealFlow";
import { hapticLight, hapticSelection } from "@/native/haptics";
import { pushCurrentWidgetSnapshot } from "@/native/nativeBridge";
import { isNativeIos } from "@/native/platform";
import { syncWatchContext } from "@/native/watchBridge";
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
    shortLabel: "خانه",
    icon: Home,
    iosIcon: Home,
  },
  {
    to: "/daily-program",
    label: "برنامه روزانه",
    shortLabel: "تمرین",
    icon: CalendarDays,
    iosIcon: Dumbbell,
  },
  {
    to: "/daily-log",
    label: "ثبت روزانه",
    shortLabel: "تغذیه",
    icon: NotebookPen,
    iosIcon: UtensilsCrossed,
  },
  {
    to: "/progress",
    label: "پیشرفت",
    shortLabel: "پیشرفت",
    icon: TrendingUp,
    iosIcon: TrendingUp,
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
  const { pathname } = useLocation();
  const nativeIos = isNativeIos();
  const activeRouteId =
    pathname === "/"
      ? "/"
      : (items.find(
          (item) =>
            item.to !== "/" &&
            (pathname === item.to || pathname.startsWith(`${item.to}/`)),
        )?.to ?? "");
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
          className={`fixed inset-0 z-30 ${nativeIos ? "bg-black/25" : ""}`}
        />
      )}

      {nativeIos ? (
        /* Apple iOS 26/27 Liquid Glass Two-Piece Floating Dock:
           1. Compact refractive Liquid Glass Tab Pill (4 tabs + sliding optical lens)
           2. Detached circular Liquid Glass (+) orb beside the pill (matching
              Apple's iOS 26/27 detached floating action/search orb pattern)
           3. Floating Liquid Glass Quick-Add Popover springing upward from the orb */
        <div
          className="pointer-events-none fixed inset-x-0 z-40"
          style={{ bottom: "calc(max(env(safe-area-inset-bottom), 14px) + 6px)" }}
        >
          <div className="pointer-events-auto mx-auto max-w-md px-4">
            <div className="relative">
              <AnimatePresence>
                {drawerOpen && (
                  <motion.div
                    key="ios-quick-add-popover"
                    initial={{ opacity: 0, scale: 0.88, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 12 }}
                    transition={{ type: "spring", stiffness: 440, damping: 32, mass: 0.85 }}
                    style={{ transformOrigin: "bottom left" }}
                    className="ios-glass-popover mb-3 overflow-hidden rounded-[28px] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between px-2 pt-0.5">
                      <span className="text-xs font-semibold text-white/60">ثبت سریع</span>
                      <span className="h-1 w-8 rounded-full bg-white/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {quickActions.map((action, idx) => (
                        <motion.button
                          key={action.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 460,
                            damping: 32,
                            delay: idx * 0.03,
                          }}
                          onClick={() => {
                            hapticLight();
                            handleQuickAction(action.onSelect);
                          }}
                          className="glass-chip flex flex-col items-center gap-2 rounded-[20px] py-3.5 text-sm font-medium text-white"
                        >
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-2xl">
                            {action.icon}
                          </span>
                          <span>{action.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2.5">
                <IosLiquidBubbleBar
                  ariaLabel="ناوبری اصلی"
                  activeId={activeRouteId}
                  onSelect={(to) => {
                    setDrawerOpen(false);
                    if (to && to !== pathname) {
                      navigate(to);
                    }
                  }}
                  heightClass="h-[62px]"
                  className="flex-1"
                  items={items.map((item) => {
                    const Icon = item.iosIcon;
                    return {
                      id: item.to,
                      ariaLabel: item.shortLabel,
                      renderContent: ({ isActive }) => (
                        <span
                          className={`flex flex-col items-center gap-0.5 whitespace-nowrap text-[10.5px] font-medium transition-colors duration-150 ${
                            isActive ? "text-avocado-yellow" : "text-white/80"
                          }`}
                        >
                          <Icon size={20} strokeWidth={isActive ? 2.25 : 1.9} />
                          <span>{item.shortLabel}</span>
                        </span>
                      ),
                    };
                  })}
                />

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.86 }}
                  transition={{ type: "spring", stiffness: 460, damping: 20 }}
                  onClick={() => {
                    hapticLight();
                    setDrawerOpen((open) => !open);
                  }}
                  aria-label={drawerOpen ? "بستن ثبت سریع" : "ثبت سریع"}
                  className="ios-glass-orb flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white [-webkit-tap-highlight-color:transparent] touch-manipulation"
                >
                  <motion.span
                    animate={{ rotate: drawerOpen ? 45 : 0, scale: drawerOpen ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="flex"
                  >
                    <Plus size={25} strokeWidth={2.2} />
                  </motion.span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="pointer-events-none fixed inset-x-0 z-40"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
        >
          <div className="pointer-events-auto mx-auto max-w-md px-5.25">
            <div className="relative">
              <AnimatePresence>
                {drawerOpen && (
                  <motion.div
                    key="quick-add-drawer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    style={{
                      position: "absolute",
                      bottom: -2,
                      borderBottomLeftRadius: BAR_HEIGHT / 2,
                      borderBottomRightRadius: BAR_HEIGHT / 2,
                    }}
                    className="glass-panel inset-x-0 z-10 overflow-hidden rounded-t-3xl"
                  >
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

              <div ref={barRef} className="relative z-20">
                {barWidth > 0 && (
                  <svg
                    aria-hidden="true"
                    width={barWidth}
                    height={BAR_HEIGHT + BUMP_RADIUS}
                    viewBox={`0 0 ${barWidth} ${BAR_HEIGHT + BUMP_RADIUS}`}
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

                <button
                  onClick={() => {
                    hapticLight();
                    setDrawerOpen((open) => !open);
                  }}
                  aria-label={drawerOpen ? "بستن ثبت سریع" : "ثبت سریع"}
                  style={{ position: "absolute", height: BUMP_RADIUS * 2, width: BUMP_RADIUS * 2 }}
                  className="glass-action glass-action-static left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white [-webkit-tap-highlight-color:transparent] touch-manipulation"
                >
                  <motion.span
                    animate={{ rotate: drawerOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex"
                  >
                    <Plus size={26} />
                  </motion.span>
                </button>

                <nav className="relative flex h-17 items-center justify-between overflow-hidden rounded-full px-1">
                  {items.map((item, itemIndex) => {
                    const Icon = item.icon;

                    // Half the items, then the gap, then the rest.
                    const spacer =
                      itemIndex === Math.ceil(items.length / 2) ? (
                        <div
                          key="quick-add-gap"
                          aria-hidden="true"
                          className="shrink-0"
                          style={{ width: BUMP_RADIUS * 2 + 12 }}
                        />
                      ) : null;

                    return (
                      <Fragment key={item.to}>
                      {spacer}
                      <NavLink
                        to={item.to}
                        onClick={() => {
                          hapticSelection();
                          setDrawerOpen(false);
                        }}
                        className="relative z-10 flex h-full w-[68px] shrink-0 items-center justify-center [-webkit-tap-highlight-color:transparent] touch-manipulation"
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
                      </Fragment>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

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
          hapticLight();
          pushCurrentWidgetSnapshot();
          syncWatchContext();
          // No standalone water page anymore — today's count now lives in
          // the "آب" row on ProgressPage's dashboard card.
          navigate("/progress");
        }}
      />

      {foodFlowModals}
    </>
  );
}
