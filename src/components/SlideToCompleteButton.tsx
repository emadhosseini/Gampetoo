import { useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Check, ChevronRight } from "lucide-react";

interface SlideToCompleteButtonProps {
  label: string;
  onComplete: () => void;
}

// Releasing past this fraction of the track snaps forward to complete
// instead of snapping back to the start.
const COMPLETE_THRESHOLD = 0.75;

// How far (in px) into the drag the yellow fill takes to fade fully in —
// it's fully hidden at rest and eases in as soon as the drag starts.
const FILL_FADE_IN_DISTANCE = 28;

const HANDLE_SIZE = 84;
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
  const fillOpacity = useTransform(x, [0, FILL_FADE_IN_DISTANCE], [0, 1]);
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
        style={{
          width: fillWidth,
          opacity: completed ? 1 : fillOpacity,
          maskImage: "linear-gradient(to right, black 82%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 82%, transparent 100%)",
        }}
      />

      <motion.span
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-16 text-center text-sm font-bold text-white"
        style={{ opacity: completed ? 0 : labelOpacity }}
      >
        {label}
      </motion.span>

      <motion.div
        className="absolute top-0 left-1 flex h-16 items-center justify-center"
        style={{ x, width: HANDLE_SIZE }}
        drag={completed ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.02}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        {completed ? (
          // The fill is solid yellow behind this by the time it shows —
          // black reads correctly there, matching the app's solid-yellow-CTA
          // convention (yellow background, black icon/text).
          <Check size={28} className="text-black" />
        ) : (
          // Forced ltr: this row's left-to-right brightest-to-faintest
          // order must hold regardless of the page's global RTL direction.
          <div dir="ltr" className="flex items-center">
            <ChevronRight size={36} className="-mr-4 text-avocado-yellow opacity-100" />
            <ChevronRight size={36} className="-mr-4 text-avocado-yellow opacity-60" />
            <ChevronRight size={36} className="text-avocado-yellow opacity-30" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
