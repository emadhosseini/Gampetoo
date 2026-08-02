import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

import { toFaDigits } from "@/utils/numberFormat";

const ITEM_HEIGHT = 40;
// One row above, the selected row, one row below.
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
// The scrollable content has this much empty space above the first (and
// below the last) item, so index 0 and the last index can still reach
// center — every item's true on-screen position is offset by this.
const EDGE_PADDING = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;
// How long the wheel must sit still before we treat it as "settled" and
// report the centered value — native scroll-snap already handles the visual
// centering, this just decides when to read the result back out.
const SETTLE_DELAY_MS = 120;

interface WheelItemProps {
  scrollY: MotionValue<number>;
  index: number;
  label: string;
}

// Reads its distance from the wheel's center off a shared scroll-position
// motion value and derives scale/opacity from it — driven entirely through
// transform/opacity (GPU-composited, no layout/reflow), so this stays smooth
// even while the container is mid-scroll on lower-end phones.
function WheelItem({ scrollY, index, label }: WheelItemProps) {
  const distance = useTransform(scrollY, (y) => {
    const itemCenter = EDGE_PADDING + index * ITEM_HEIGHT + ITEM_HEIGHT / 2;
    const viewCenter = y + CONTAINER_HEIGHT / 2;

    return itemCenter - viewCenter;
  });

  const scale = useTransform(
    distance,
    [-ITEM_HEIGHT, 0, ITEM_HEIGHT],
    [0.65, 1.15, 0.65],
  );

  const opacity = useTransform(
    distance,
    [-ITEM_HEIGHT, 0, ITEM_HEIGHT],
    [0.35, 1, 0.35],
  );

  return (
    <div style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center" }}>
      <motion.div
        style={{ scale, opacity }}
        className="text-forest-900 flex h-full items-center justify-center text-2xl font-bold tabular-nums"
      >
        {label}
      </motion.div>
    </div>
  );
}

export interface WheelColumnProps {
  values: number[];
  selected: number;
  onSettle: (value: number) => void;
  format?: (value: number) => string;
  className?: string;
}

export function WheelColumn({
  values,
  selected,
  onSettle,
  format = toFaDigits,
  className = "",
}: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Jump to the initial value without animating.
  useEffect(() => {
    const container = containerRef.current;
    const index = values.indexOf(selected);

    if (!container || index === -1) return;

    container.scrollTo({ top: index * ITEM_HEIGHT, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    if (settleTimer.current) clearTimeout(settleTimer.current);

    settleTimer.current = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const index = Math.round(container.scrollTop / ITEM_HEIGHT);
      const clamped = Math.min(values.length - 1, Math.max(0, index));

      // proximity (rather than mandatory) lets a fast flick coast through
      // many items on its own momentum instead of hard-resisting between
      // every single one — this corrective scroll guarantees the settled
      // item still ends up exactly centered even if momentum let it stop
      // a few pixels off a snap point.
      container.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });

      onSettle(values[clamped]);
    }, SETTLE_DELAY_MS);
  }

  return (
    <div className={`relative ${className}`} style={{ height: CONTAINER_HEIGHT }}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="no-scrollbar h-full overflow-y-scroll"
        style={{
          scrollSnapType: "y proximity",
          // Vertical scrolling only — no horizontal/diagonal panning.
          touchAction: "pan-y",
          paddingBlock: EDGE_PADDING,
        }}
      >
        {values.map((value, index) => (
          <WheelItem
            key={value}
            scrollY={scrollY}
            index={index}
            label={format(value)}
          />
        ))}
      </div>

      {/* Center selection band — a thin indicator line only, no fill. */}
      <div
        className="border-forest-900/25 pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-y"
        style={{ height: ITEM_HEIGHT }}
      />
    </div>
  );
}
