import { motion } from "framer-motion";

export interface LightSweepConfig {
  /** Radial gradient core color (include alpha here if you want it baked in). */
  color?: string;
  /** Diameter as vw units — deliberately larger than the viewport so its
   * edges never show as it sweeps and rotates. */
  size?: number;
  /** Gaussian blur in px. Large values are what keep this from ever reading
   * as a crisp, identifiable shape. */
  blur?: number;
  /** 0–1 layer opacity. */
  opacity?: number;
  /** Base duration (seconds) for the horizontal sweep; every other axis
   * derives its own independent, non-integer-multiple duration from this so
   * none of the motions ever re-sync into a noticeable repeating pattern. */
  speed?: number;
  /** How far the sweep travels left/right, as a % of its own width. */
  xRange?: number;
  /** How far it drifts vertically, as a % of its own height. */
  yRange?: number;
  /** Max rotation drift, in degrees either direction. */
  rotation?: number;
  /** Max scale delta from 1 (e.g. 0.1 → breathes between ~0.94x and ~1.1x). */
  scale?: number;
  /** Static positioning — set once, never animated. */
  top?: string;
  left?: string;
  className?: string;
}

const DEFAULTS = {
  color: "rgba(255, 255, 255, 0.9)",
  size: 130,
  blur: 120,
  opacity: 0.18,
  speed: 42,
  xRange: 30,
  yRange: 10,
  rotation: 6,
  scale: 0.1,
  top: "-25%",
  left: "-25%",
} satisfies Required<Omit<LightSweepConfig, "className">>;

/**
 * The large, heavily-blurred radial "fog" light that drifts across the
 * background. Four independent Framer Motion loops (x, y, scale, rotate)
 * each run on their own duration/easing so the combined motion never lines
 * up into an identifiable cycle — only x is a left-right mirror (the
 * described "sweep"); y/scale/rotate loop through multi-point keyframes that
 * start and end at the same value, so every repeat is seamless.
 */
export default function LightSweep({
  color = DEFAULTS.color,
  size = DEFAULTS.size,
  blur = DEFAULTS.blur,
  opacity = DEFAULTS.opacity,
  speed = DEFAULTS.speed,
  xRange = DEFAULTS.xRange,
  yRange = DEFAULTS.yRange,
  rotation = DEFAULTS.rotation,
  scale = DEFAULTS.scale,
  top = DEFAULTS.top,
  left = DEFAULTS.left,
  className = "",
}: LightSweepConfig) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: `${size}vw`,
        height: `${size}vw`,
        top,
        left,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity,
        willChange: "transform",
      }}
      animate={{
        x: [`-${xRange}%`, `${xRange}%`],
        y: [
          "0%",
          `${-yRange * 0.7}%`,
          `${yRange}%`,
          `${-yRange * 0.3}%`,
          `${yRange * 0.6}%`,
          "0%",
        ],
        scale: [
          1,
          1 + scale * 0.5,
          1 - scale * 0.3,
          1 + scale,
          1 - scale * 0.6,
          1,
        ],
        rotate: [
          0,
          rotation * 0.6,
          -rotation * 0.3,
          rotation,
          -rotation * 0.5,
          0,
        ],
      }}
      transition={{
        x: {
          duration: speed,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        },
        y: { duration: speed * 0.83, repeat: Infinity, ease: "easeInOut" },
        scale: {
          duration: speed * 1.27,
          repeat: Infinity,
          ease: "easeInOut",
        },
        rotate: {
          duration: speed * 0.64,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    />
  );
}
