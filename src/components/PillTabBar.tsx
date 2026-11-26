import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import IosLiquidBubbleBar from "@/components/IosLiquidBubbleBar";
import { hapticSelection } from "@/native/haptics";
import { isNativeIos } from "@/native/platform";

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
  const nativeIos = isNativeIos();

  if (nativeIos) {
    return (
      <div className="px-5.25 pt-10">
        <div className="mx-auto max-w-md">
          <IosLiquidBubbleBar
            activeId={active}
            onSelect={onChange}
            heightClass="h-14"
            items={items.map((item) => {
              const Icon = item.icon;
              return {
                id: item.id,
                ariaLabel: item.label,
                renderContent: ({ isActive }) => (
                  <span
                    className={`flex flex-row items-center gap-1.5 text-xs font-semibold transition-colors duration-150 ${
                      isActive ? "text-avocado-yellow" : "text-white/80"
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.25 : 1.9} />
                    <span>{item.label}</span>
                  </span>
                ),
              };
            })}
          />
        </div>
      </div>
    );
  }

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
                onClick={() => {
                  hapticSelection();
                  onChange(item.id);
                }}
                className="relative z-10 flex h-full flex-1 items-center justify-center [-webkit-tap-highlight-color:transparent] touch-manipulation"
              >
                {isActive && (
                  <motion.div
                    layoutId={layoutId}
                    className="absolute inset-1 rounded-full bg-white/10"
                    transition={{
                      type: "spring",
                      stiffness: 440,
                      damping: 32,
                      mass: 0.9,
                    }}
                  />
                )}

                <span
                  className={`relative flex flex-col items-center gap-1 text-xs transition-[color,transform] duration-150 active:scale-95 ${
                    isActive ? "text-avocado-yellow" : "text-white/80"
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
