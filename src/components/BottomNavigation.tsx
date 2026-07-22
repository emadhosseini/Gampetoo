import { NavLink } from "react-router-dom";
import {
  Home,
  Dumbbell,
  UtensilsCrossed,
  Settings,
} from "lucide-react";

const items = [
  {
    to: "/",
    label: "خانه",
    icon: Home,
  },
  {
    to: "/workout",
    label: "تمرین",
    icon: Dumbbell,
  },
  {
    to: "/nutrition",
    label: "تغذیه",
    icon: UtensilsCrossed,
  },
  {
    to: "/settings",
    label: "تنظیمات",
    icon: Settings,
  },
];

export default function BottomNavigation() {
  return (
    <nav className="pb-safe fixed bottom-0 left-0 right-0 border-t border-white/5 bg-forest-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-xs transition-colors ${
                  isActive
                    ? "text-avocado-yellow"
                    : "text-white"
                }`
              }
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}