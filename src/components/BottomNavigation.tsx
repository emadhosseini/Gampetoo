import { motion } from "framer-motion";
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
        {/* Floating glass pill, ported from Figma's "Tab Bar - iPhone"
            component (node 38:906, Apple's own iOS tab-bar pattern —
            https://developer.apple.com/design/human-interface-guidelines/tab-bars).
            The bar itself reuses the same glass recipe as
            SideMenu.tsx/the Action Sheet component (dark top/bottom
            vignette + light top highlight); the hairline is a low-alpha,
            slightly-blurred version of Figma's literal hairline (the exact
            value rendered as a hard, complete ring in Chromium, unlike
            Figma's own softer render of it). New here: each tab gets a
            sliding "Selection" pill behind it when active, via a shared
            framer-motion layoutId — the actual defining trait of an iOS
            tab bar (it glides between tabs on switch instead of just
            appearing). */}
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
                opposite of what Figma actually renders here. The light
                top-edge and dark top/bottom inner shadows are the other two
                layers of the same node's real Effects stack (read directly
                from Figma's Effects panel, since design-context export
                doesn't surface Figma's native Glass material or its inner
                shadows at all). */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                boxShadow:
                  "inset 0px 40px 30px -40px rgba(230, 230, 230, 1), inset 0px 40px 10px -40px rgba(40, 40, 40, 1), inset 0px -40px 10px -40px rgba(40, 40, 40, 1)",
              }}
            />

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