import { motion } from "framer-motion";

export interface NoiseLayerConfig {
  /** 0–1. Kept very low so the grain reads as texture, not visible static. */
  opacity?: number;
  /** Size of the repeating noise tile, in px. */
  tileSize?: number;
  /** feTurbulence baseFrequency — higher is finer-grained noise. */
  baseFrequency?: number;
  /** Max drift distance in px — the "2–3 pixels every few seconds" feel. */
  driftPixels?: number;
  /** Full loop duration in seconds. */
  duration?: number;
  className?: string;
}

const DEFAULTS = {
  opacity: 0.04,
  tileSize: 200,
  baseFrequency: 0.85,
  driftPixels: 3,
  duration: 34,
} satisfies Required<Omit<NoiseLayerConfig, "className">>;

function buildNoiseDataUri(tileSize: number, baseFrequency: number): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${tileSize}' height='${tileSize}'>` +
    `<filter id='n'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='2' stitchTiles='stitch'/>` +
    `<feColorMatrix type='saturate' values='0'/>` +
    `</filter>` +
    `<rect width='100%' height='100%' filter='url(#n)'/>` +
    `</svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * A grain texture that reads as static but drifts by a few pixels on a very
 * slow loop — enough to avoid looking like a dead, perfectly still overlay
 * without ever being perceptible as "moving". Position only (transform),
 * never resized or repositioned via top/left, so it stays GPU-composited.
 */
export default function NoiseLayer({
  opacity = DEFAULTS.opacity,
  tileSize = DEFAULTS.tileSize,
  baseFrequency = DEFAULTS.baseFrequency,
  driftPixels = DEFAULTS.driftPixels,
  duration = DEFAULTS.duration,
  className = "",
}: NoiseLayerConfig) {
  const d = driftPixels;

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: buildNoiseDataUri(tileSize, baseFrequency),
        backgroundRepeat: "repeat",
        mixBlendMode: "overlay",
        opacity,
        willChange: "transform",
      }}
      animate={{
        x: [0, d, -d * 0.6, d * 0.8, -d, d * 0.3, 0],
        y: [0, -d * 0.7, d, -d * 0.4, d * 0.6, -d * 0.2, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
