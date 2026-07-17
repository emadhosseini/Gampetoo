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
    <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950">
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
                    ? "text-emerald-400"
                    : "text-zinc-500"
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