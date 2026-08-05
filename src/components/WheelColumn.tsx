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
  textClass: string;
}

// Reads its distance from the wheel's center off a shared scroll-position
// motion value and derives scale/opacity from it — driven entirely through
// transform/opacity (GPU-composited, no layout/reflow), so this stays smooth
// even while the container is mid-scroll on lower-end phones.
function WheelItem({ scrollY, index, label, textClass }: WheelItemProps) {
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

  // 0.45 rather than 0.35 for the neighbours: they still recede clearly
  // behind the centered value, but stay legible enough to see what you're
  // scrolling toward.
  const opacity = useTransform(
    distance,
    [-ITEM_HEIGHT, 0, ITEM_HEIGHT],
    [0.45, 1, 0.45],
  );

  return (
    <div style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center" }}>
      {/* White, not forest-900: these digits used to sit on a light surface,
          but every panel that holds a picker is glass now — dark green on a
          dark translucent panel was effectively invisible. */}
      <motion.div
        style={{ scale, opacity }}
        className={`flex h-full items-center justify-center font-bold tabular-nums text-white ${textClass}`}
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
  // Type scale for the wheel's labels. Numbers fit the default at any
  // column width; a column of words (month names) needs to come down a
  // size or the longest of them overflows its column.
  textClass?: string;
}

export function WheelColumn({
  values,
  selected,
  onSettle,
  format = toFaDigits,
  className = "",
  textClass = "text-2xl",
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
            textClass={textClass}
          />
        ))}
      </div>

      {/* Center selection band — a thin indicator line only, no fill. */}
      <div
        className="pointer-events-none border-white/20 absolute inset-x-0 top-1/2 -translate-y-1/2 border-y"
        style={{ height: ITEM_HEIGHT }}
      />
    </div>
  );
}
