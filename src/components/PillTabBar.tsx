import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface PillTabBarItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface PillTabBarProps<T extends string> {
  items: PillTabBarItem<T>[];
  active: T;
  onChange: (id: T) => void;
  // Distinguishes this bar's sliding selection from any other PillTabBar
  // (or the real BottomNavigation) mounted at the same time — framer-motion
  // animates shared layout between any two elements with the same layoutId.
  layoutId: string;
}

// Same iOS-tab-bar recipe as BottomNavigation.tsx (glass-panel pill, sliding
// selection via a shared framer-motion layoutId), reused wherever a page
// needs an in-page tab switcher instead of separate routes.
export default function PillTabBar<T extends string>({
  items,
  active,
  onChange,
  layoutId,
}: PillTabBarProps<T>) {
  return (
    <div className="px-5.25 pt-10">
      <div className="glass-panel mx-auto max-w-md rounded-full">
        <nav className="relative flex h-17 items-center justify-around overflow-hidden rounded-full">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className="relative z-10 flex h-full flex-1 items-center justify-center [-webkit-tap-highlight-color:transparent] touch-manipulation"
              >
                {isActive && (
                  <motion.div
                    layoutId={layoutId}
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
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
