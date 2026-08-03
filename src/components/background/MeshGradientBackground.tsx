import NoiseLayer from "@/components/background/NoiseLayer";

interface MeshGradientBackgroundProps {
  /** Hex color for the top-left glow. */
  colorA: string;
  /** Hex color for the top-right glow. */
  colorB: string;
  className?: string;
}

// Static, filter-free glow layer. This used to be two framer-motion divs
// with filter: blur(110px) animating x/y/scale/opacity in an infinite
// loop — imperceptible on a desktop GPU, catastrophic on iOS WebKit: a
// 110px blur keeps two multi-megapixel intermediate buffers alive, and
// the never-ending animation re-composited them at 60fps on every single
// screen (this component sits under the whole app shell, the login page,
// and the error screen). That pegged the phone's GPU permanently — hot
// device even at idle, and seconds of tap latency because every real
// interaction had to fight the background for GPU time. A radial
// gradient IS a soft glow: painted once, no filter, no animation,
// visually near-identical, and free after first paint. Do not reintroduce
// large blur() layers or infinite animations here.
export default function MeshGradientBackground({
  colorA,
  colorB,
  className = "",
}: MeshGradientBackgroundProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute -left-1/4 -top-1/4 h-[110%] w-[85%]"
        style={{
          background: `radial-gradient(closest-side, ${colorA}99 0%, ${colorA}4d 40%, ${colorA}1a 65%, transparent 88%)`,
        }}
      />

      <div
        className="absolute -right-1/4 -top-1/4 h-[110%] w-[85%]"
        style={{
          background: `radial-gradient(closest-side, ${colorB}99 0%, ${colorB}4d 40%, ${colorB}1a 65%, transparent 88%)`,
        }}
      />

      <NoiseLayer />
    </div>
  );
}
