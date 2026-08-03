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
  onComplete: () => void;
}

// Releasing past this fraction of the track snaps forward to complete
// instead of snapping back to the start.
const COMPLETE_THRESHOLD = 0.75;

// How far (in px) into the drag the blurred trail takes to fade fully in.
// It's hidden at rest — at x=0 the trail is exactly the handle's width, and
// a blurred patch sitting under the circle before you've touched anything
// just looks like a rendering artifact.
const TRAIL_FADE_IN_DISTANCE = 28;

const HANDLE_SIZE = 56;
const TRACK_INSET = 4;

export default function SlideToCompleteButton({
  label,
  onComplete,
}: SlideToCompleteButtonProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(0);
  const [completed, setCompleted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const trailWidth = useTransform(x, (value) => `${TRACK_INSET + HANDLE_SIZE + value}px`);
  const trailOpacity = useTransform(x, [0, TRAIL_FADE_IN_DISTANCE], [0, 1]);
  const labelOpacity = useTransform(x, [0, Math.max(maxDrag * 0.5, 1)], [1, 0]);

  useLayoutEffect(() => {
    function measure() {
      const width = trackRef.current?.getBoundingClientRect().width ?? 0;
      setMaxDrag(Math.max(width - HANDLE_SIZE - TRACK_INSET * 2, 0));
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);

    return () => observer.disconnect();
  }, []);

  function handleDragEnd() {
    if (completed) return;

    const progress = maxDrag > 0 ? x.get() / maxDrag : 0;
    const snapTransition = prefersReducedMotion
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 420, damping: 38 };

    if (progress >= COMPLETE_THRESHOLD) {
      setCompleted(true);

      animate(x, maxDrag, {
        ...snapTransition,
        onComplete: () => {
          window.setTimeout(onComplete, 250);
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
      className="glass-panel relative mt-6 h-16 w-full overflow-hidden rounded-full"
    >
      {/* The trail the handle leaves behind: a blur of whatever the page is
          showing underneath, not a colored fill. Deliberately carries no
          mask-image — WebKit can drop backdrop-filter entirely when it's
          combined with a mask, and this app has already hit iOS
          backdrop-filter bugs (see ModalOverlay), so the leading edge is
          capped by the handle circle instead. translateZ(0)/will-change is
          the same GPU-layer promotion ModalOverlay needs to make
          backdrop-filter paint reliably on iOS. */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 bg-white/10 backdrop-blur-[30px]"
        style={{
          width: trailWidth,
          opacity: completed ? 1 : trailOpacity,
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

      <motion.div
        className="absolute top-1 left-1 flex items-center justify-center"
        style={{ x, width: HANDLE_SIZE, height: HANDLE_SIZE }}
        drag={completed ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.02}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        {/* .glass-panel forces position: relative in index.css and would
            beat an "absolute" utility class, so the draggable wrapper above
            owns the positioning and this inner circle only carries the
            look — same split used for the bottom nav's own round button. */}
        <div className="glass-panel flex h-full w-full items-center justify-center rounded-full text-white">
          {completed ? <Check size={26} /> : <ArrowRight size={26} />}
        </div>
      </motion.div>
    </div>
  );
}
