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
    <div
      className="pointer-events-none fixed inset-x-0 z-40"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
    >
      <div className="pointer-events-auto relative mx-auto max-w-md px-5.25">
        {/* Floating glass pill, ported from the Figma Action Sheet component
            (same recipe as SideMenu.tsx) — fully transparent (no backdrop
            blur, unlike the side menu) so the page scrolls crisply behind
            it. The hairline's shape/geometry is Figma's own exact values,
            but its fully-opaque #dbdbdb rendered as a hard, complete ring
            in Chromium — much bolder than Figma's own softer render of the
            same node (node 24:535) — so the color here is a low-alpha,
            slightly-blurred version of the same line instead of a literal
            copy, to land on the same soft-glint look. */}
        <div
          className="relative rounded-full"
          style={{
            boxShadow:
              "1.25px 0px 1px -0.75px rgba(219, 219, 219, 0.35), -1.25px 0px 1px -0.75px rgba(219, 219, 219, 0.35), 0px 0px 0.5px 0.5px rgba(219, 219, 219, 0.3), 0px 10px 30px -14px rgba(0, 0, 0, 0.55)",
          }}
        >
          <nav className="relative flex h-17 items-center justify-around overflow-hidden rounded-full">
            {/* Pixel-sampled from Figma's own render of this Action Sheet
                (node 29:20): the pill is ~8-10% darker than the page behind
                it, flat across its whole width — no highlight/shine
                gradient. A translucent white veil (tried earlier) is the
                opposite of what Figma actually renders here. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}
            />

            {items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative z-10 flex flex-col items-center gap-1 text-xs transition-[color,transform] duration-150 [-webkit-tap-highlight-color:transparent] touch-manipulation active:scale-95 ${
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
          </nav>
        </div>
      </div>
    </div>
  );
}