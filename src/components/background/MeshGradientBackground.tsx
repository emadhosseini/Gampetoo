interface MeshGradientBackgroundProps {
  /** Hex color the glow fades through, just past the bright corner. */
  colorA: string;
  /** Hex color for the bright glow anchored at the top-right corner. */
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
// interaction had to fight the background for GPU time. A single radial
// gradient is just as cheap as the diagonal linear one this replaced: one
// paint, no filter, no animation, no noise texture on top. Do not
// reintroduce large blur() layers or infinite animations here.
export default function MeshGradientBackground({
  colorA,
  colorB,
  className = "",
}: MeshGradientBackgroundProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      style={{
        background: `radial-gradient(130% 100% at 100% 0%, ${colorB} 0%, ${colorA} 30%, #0a140f 62%, #040705 100%)`,
      }}
    />
  );
}
