import { useState } from "react";
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

            {/* Sits centered on the nav pill's top edge, half above it —
                same spot whether the drawer is open or closed, so the
                drawer (bottom-full above) reads as growing out from behind
                this button rather than the button moving to meet it. */}
            <button
              onClick={() => setDrawerOpen((open) => !open)}
              aria-label={drawerOpen ? "بستن ثبت سریع" : "ثبت سریع"}
              // Same .glass-panel-vs-"absolute" cascade conflict as the
              // drawer above — inline style is what actually wins.
              style={{ position: "absolute" }}
              className="glass-panel left-1/2 top-0 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white [-webkit-tap-highlight-color:transparent] touch-manipulation"
            >
              <motion.span
                animate={{ rotate: drawerOpen ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex"
              >
                <Plus size={26} />
              </motion.span>
            </button>

            {/* Floating pill, same glass-panel treatment as every other card in
                the app (index.css) instead of a bespoke recipe. Tab selection
                is ported from Figma's "Tab Bar - iPhone" component (node
                38:906, Apple's own iOS tab-bar pattern —
                https://developer.apple.com/design/human-interface-guidelines/tab-bars):
                each tab gets a sliding "Selection" pill behind it when active,
                via a shared framer-motion layoutId — the defining trait of an
                iOS tab bar (it glides between tabs on switch instead of just
                appearing). */}
            <div className="glass-panel rounded-full">
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
