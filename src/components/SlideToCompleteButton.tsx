import { useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

interface SlideToCompleteButtonProps {
  label: string;
  // Fires once the handle is dragged all the way to the end (not a
  // partial-drag threshold — releasing anywhere short of the very end
  // snaps back to the start instead). The button locks at the end,
  // showing a checkmark, until the caller either acts on it or resets it
  // (e.g. by changing this component's `key` to remount it) if whatever
  // confirmation the caller shows gets cancelled.
  onReachEnd: () => void;
}

// Matches the bottom navigation's own pill height (h-17) exactly. At rest
// the capsule is a circle of this diameter; dragging stretches it — the
// capsule itself grows, nothing detaches and slides.
const HANDLE_SIZE = 68;

// The capsule's own glass treatment. Not .glass-panel: that class forces
// position: relative (breaking the absolute placement here) and carries a
// press-scale :active transform that would fire mid-drag. Same hairline
// recipe, minus the bottom drop shadow the track already provides.
const CAPSULE_SHADOW = [
  "1.25px 0px 1px -0.75px rgb(219 219 219 / 35%)",
  "-1.25px 0px 1px -0.75px rgb(219 219 219 / 35%)",
  "0px 0px 0.5px 0.5px rgb(219 219 219 / 30%)",
].join(", ");

export default function SlideToCompleteButton({
  label,
  onReachEnd,
}: SlideToCompleteButtonProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(0);
  const [completed, setCompleted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const capsuleWidth = useTransform(x, (value) => `${HANDLE_SIZE + value}px`);
  const labelOpacity = useTransform(x, [0, Math.max(maxDrag * 0.5, 1)], [1, 0]);

  useLayoutEffect(() => {
    function measure() {
      const width = trackRef.current?.getBoundingClientRect().width ?? 0;
      setMaxDrag(Math.max(width - HANDLE_SIZE, 0));
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);

    return () => observer.disconnect();
  }, []);

  function handleDragEnd() {
    if (completed) return;

    // A tiny tolerance for sub-pixel drag-constraint rounding — anything
    // short of the actual end still snaps all the way back, per the "only
    // 100% counts" requirement (no partial-drag threshold like before).
    const reachedEnd = maxDrag > 0 && x.get() >= maxDrag - 1;
    const snapTransition = prefersReducedMotion
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 420, damping: 38 };

    if (reachedEnd) {
      setCompleted(true);

      animate(x, maxDrag, {
        ...snapTransition,
        onComplete: () => {
          window.setTimeout(onReachEnd, 250);
        },
      });
    } else {
      animate(x, 0, snapTransition);
    }
  }

  return (
    // Same pill shape and glass treatment as the bottom navigation bar, so
    // the two read as one family rather than two different button styles.
    <div
      ref={trackRef}
      role="button"
      aria-label={label}
      className="glass-panel glass-static relative mt-6 h-17 w-full overflow-hidden rounded-full"
    >
      {/* The stretching capsule: a circle at rest that elongates with the
          drag, blurring whatever the page shows underneath it. rounded-full
          on the element itself keeps the backdrop blur clipped inside the
          capsule shape (not spilling past its curved leading edge).
          Deliberately carries no mask-image — WebKit can drop
          backdrop-filter entirely when it's combined with a mask, and this
          app has already hit iOS backdrop-filter bugs (see ModalOverlay), so
          translateZ(0)/will-change is the same GPU-layer promotion
          ModalOverlay needs to make backdrop-filter paint reliably on iOS. */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-white/10 backdrop-blur-[30px]"
        style={{
          width: capsuleWidth,
          boxShadow: CAPSULE_SHADOW,
          transform: "translateZ(0)",
          willChange: "backdrop-filter",
        }}
      />

      <motion.span
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-20 text-center text-sm font-bold text-white"
        style={{ opacity: completed ? 0 : labelOpacity }}
      >
        {label}
      </motion.span>

      {/* Invisible drag surface riding the capsule's leading edge — it only
          carries the icon, so the arrow stays centered on the round end of
          the capsule while the capsule itself does the visual moving. */}
      <motion.div
        className="absolute top-0 left-0 flex items-center justify-center text-white"
        style={{ x, width: HANDLE_SIZE, height: HANDLE_SIZE }}
        drag={completed ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.02}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        {completed ? <Check size={26} /> : <ArrowRight size={26} />}
      </motion.div>
    </div>
  );
}
