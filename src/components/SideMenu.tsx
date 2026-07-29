import { Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";

const DRAWER_WIDTH = "66.6667%";

interface SideMenuProps {
  children: ReactNode;
}

export default function SideMenu({ children }: SideMenuProps) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 34 };

  return (
    <div className="relative overflow-x-hidden">
      <motion.div
        animate={{ x: open ? `-${DRAWER_WIDTH}` : 0 }}
        transition={transition}
        className="relative z-10"
      >
        {children}
      </motion.div>

      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : "100%" }}
        transition={transition}
        style={{ width: DRAWER_WIDTH }}
        className="absolute inset-y-0 right-0 z-20"
        aria-hidden={!open}
      >
        <div className="glass-panel h-full rounded-none border-y-0 border-l-0 px-5 pt-safe">
          <h2 className="pt-16 text-lg font-bold text-white">منو</h2>
        </div>
      </motion.aside>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
        <div className="pointer-events-auto relative mx-auto max-w-md">
          <button
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            className="glass-chip absolute right-4 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
