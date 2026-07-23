import { useEffect, useMemo, useRef, useState } from "react";
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

interface WheelColumnProps {
  values: number[];
  selected: number;
  onSettle: (value: number) => void;
  format?: (value: number) => string;
  className?: string;
}

function WheelColumn({
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

export interface WeightPickerProps {
  /** Initial weight in kg, e.g. 75.5. */
  value?: number;
  onChange: (weight: number) => void;
  minKg?: number;
  maxKg?: number;
  className?: string;
}

// An iOS-style dual wheel-picker for weight: kg (whole number) on the left,
// grams (two digits) on the right, separated by a decimal point. Each column
// is its own native-scrolling wheel — momentum, touch, and snap-to-center
// all come from the browser, so it feels identical to a native picker on
// both iOS and Android without hand-rolled drag physics.
export default function WeightPicker({
  value = 70,
  onChange,
  minKg = 0,
  maxKg = 250,
  className = "",
}: WeightPickerProps) {
  const clampedValue = Math.min(maxKg, Math.max(minKg, value));
  const initialKg = Math.floor(clampedValue);
  const initialGrams = Math.round((clampedValue - initialKg) * 100);

  const [kg, setKg] = useState(initialKg);
  const [grams, setGrams] = useState(initialGrams);

  const kgValues = useMemo(
    () => Array.from({ length: maxKg - minKg + 1 }, (_, i) => minKg + i),
    [minKg, maxKg],
  );

  const gramValues = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);

  function handleKgSettle(newKg: number) {
    setKg(newKg);
    onChange(Number((newKg + grams / 100).toFixed(2)));
  }

  function handleGramSettle(newGrams: number) {
    setGrams(newGrams);
    onChange(Number((kg + newGrams / 100).toFixed(2)));
  }

  return (
    // dir="ltr" keeps kg-then-grams in natural numeric reading order (e.g.
    // "70.00") — without it, the page's global RTL direction reverses the
    // flex order and puts grams on the left of the decimal point.
    <div dir="ltr" className={`flex items-center justify-center ${className}`}>
      <WheelColumn
        values={kgValues}
        selected={initialKg}
        onSettle={handleKgSettle}
        className="w-16"
      />

      <span className="text-forest-900 pb-1 text-2xl font-bold">.</span>

      <WheelColumn
        values={gramValues}
        selected={initialGrams}
        onSettle={handleGramSettle}
        format={(v) => toFaDigits(v.toString().padStart(2, "0"))}
        className="w-14"
      />
    </div>
  );
}
