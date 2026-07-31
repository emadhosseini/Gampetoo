import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  Home,
  CalendarDays,
  TrendingUp,
  Settings,
} from "lucide-react";

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
    to: "/progress",
    label: "پیشرفت",
    icon: TrendingUp,
  },
  {
    to: "/settings",
    label: "تنظیمات",
    icon: Settings,
  },
];

export default function BottomNavigation() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
    >
      <div className="pointer-events-auto relative mx-auto max-w-md px-5.25">
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
  );
}