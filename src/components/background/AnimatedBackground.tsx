import type { ReactNode } from "react";

import LightSweep, { type LightSweepConfig } from "./LightSweep";
import NoiseLayer, { type NoiseLayerConfig } from "./NoiseLayer";

export interface AnimatedBackgroundProps {
  /** Static gradient stops, given from the outside — 2 or 3 colors. */
  colors?: string[];
  /** Overrides for the large primary sweep. */
  sweep?: LightSweepConfig;
  /** Overrides for the smaller secondary glow. */
  secondaryGlow?: LightSweepConfig;
  /** Overrides for the grain layer. */
  noise?: NoiseLayerConfig;
  className?: string;
  children?: ReactNode;
}

const DEFAULT_COLORS = ["#0a0a0f", "#151022", "#05060a"];

const SECONDARY_GLOW_DEFAULTS: LightSweepConfig = {
  color: "rgba(120, 170, 255, 0.85)",
  size: 75,
  blur: 90,
  opacity: 0.12,
  speed: 58,
  xRange: 18,
  yRange: 14,
  rotation: 10,
  scale: 0.15,
  top: "35%",
  left: "40%",
};

/**
 * Premium, Apple-Sports-style living background: a fixed gradient base with
 * a large blurred light "fog" sweeping slowly across it, a smaller secondary
 * glow drifting independently, and a barely-there grain layer on top — all
 * driven by transform/opacity/filter only (see LightSweep/NoiseLayer), never
 * background-position or layout properties, so it stays GPU-composited.
 *
 * Structure:
 *   AnimatedBackground
 *   ├── Static Gradient
 *   ├── Noise Layer
 *   ├── Large Light Sweep
 *   ├── Secondary Glow
 *   └── Content
 */
export default function AnimatedBackground({
  colors = DEFAULT_COLORS,
  sweep,
  secondaryGlow,
  noise,
  className = "",
  children,
}: AnimatedBackgroundProps) {
  const [first, second = first, third = second] = colors;

  const staticGradient = `radial-gradient(120% 120% at 20% 15%, ${first} 0%, ${second} 45%, ${third} 100%)`;

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden ${className}`}
    >
      <div aria-hidden className="absolute inset-0" style={{ background: staticGradient }} />

      <NoiseLayer {...noise} />

      <LightSweep {...sweep} />

      <LightSweep {...SECONDARY_GLOW_DEFAULTS} {...secondaryGlow} />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
