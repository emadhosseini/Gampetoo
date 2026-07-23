import { useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Check, ChevronsRight } from "lucide-react";

interface SlideToCompleteButtonProps {
  label: string;
  onComplete: () => void;
}

// Releasing past this fraction of the track snaps forward to complete
// instead of snapping back to the start.
const COMPLETE_THRESHOLD = 0.75;

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
  const fillWidth = useTransform(x, (value) => `${TRACK_INSET + HANDLE_SIZE + value}px`);
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
    <div
      ref={trackRef}
      role="button"
      aria-label={label}
      className="glass-panel relative mt-6 h-16 w-full overflow-hidden rounded-2xl"
    >
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 bg-avocado-yellow"
        style={{ width: fillWidth }}
      />

      <motion.span
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-16 text-center text-sm font-bold text-white"
        style={{ opacity: completed ? 0 : labelOpacity }}
      >
        {label}
      </motion.span>

      <motion.div
        className="absolute top-1 left-1 flex items-center justify-center rounded-full bg-black text-avocado-yellow shadow-lg"
        style={{ x, width: HANDLE_SIZE, height: HANDLE_SIZE }}
        drag={completed ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.02}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        {completed ? <Check size={22} /> : <ChevronsRight size={22} />}
      </motion.div>
    </div>
  );
}
