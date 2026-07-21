import { motion, useReducedMotion } from "framer-motion";

import NoiseLayer from "@/components/background/NoiseLayer";

interface MeshGradientBackgroundProps {
  /** Hex color for the top-left glow (e.g. home team). */
  colorA: string;
  /** Hex color for the top-right glow (e.g. away team). */
  colorB: string;
  className?: string;
}

const glowTransition = (duration: number) => ({
  duration,
  repeat: Infinity,
  ease: "easeInOut" as const,
});

export default function MeshGradientBackground({
  colorA,
  colorB,
  className = "",
}: MeshGradientBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="absolute -left-1/4 -top-1/4 h-[110%] w-[85%] rounded-full blur-[110px]"
        style={{ backgroundColor: colorA, willChange: "transform, opacity" }}
        animate={
          prefersReducedMotion
            ? { opacity: 0.65 }
            : {
                x: [0, 24, -8, 0],
                y: [0, 16, 6, 0],
                scale: [1, 1.15, 1.05, 1],
                opacity: [0.55, 0.8, 0.65, 0.55],
              }
        }
        transition={prefersReducedMotion ? undefined : glowTransition(24)}
      />

      <motion.div
        className="absolute -right-1/4 -top-1/4 h-[110%] w-[85%] rounded-full blur-[110px]"
        style={{ backgroundColor: colorB, willChange: "transform, opacity" }}
        animate={
          prefersReducedMotion
            ? { opacity: 0.7 }
            : {
                x: [0, -24, 10, 0],
                y: [0, 20, -6, 0],
                scale: [1, 1.2, 1.08, 1],
                opacity: [0.55, 0.85, 0.6, 0.55],
              }
        }
        transition={prefersReducedMotion ? undefined : glowTransition(29)}
      />

      <NoiseLayer />
    </div>
  );
}
