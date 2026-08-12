import { useLayoutEffect, useRef, useState } from "react";

import type { StatBucket } from "@/utils/statBuckets";
import { computeWeightAxis } from "@/utils/weightChartAxis";
import { toFaDigits } from "@/utils/numberFormat";

// Apple Health's neon purple, at Apple's own line weight.
const LINE_COLOR = "#C084FC";
const LINE_WIDTH = 2.5;
const TARGET_COLOR = "#f87171";

// Room for the Y labels (right, per RTL) and the X labels (bottom).
const PADDING = { top: 14, right: 42, bottom: 26, left: 10 };

const POINT_RADIUS = 4;
const MAX_X_LABELS = 6;

export interface WeightChartProps {
  points: StatBucket[];
  /**
   * Dashed goal line. Smart Zoom: the Y axis is built from the logged
   * weights alone (see computeWeightAxis) and never stretches to reach
   * this — a target far outside the data's own spread instead gets its
   * line pinned flat against whichever edge it's past, with its own small
   * label, while the rest of the chart stays zoomed in on the real trend.
   */
  targetValue?: number;
}

/**
 * The weight trend, drawn as plain SVG rather than through chart.js.
 *
 * Two behaviours it exists for. The Y axis picks its own step from the
 * spread of the data in view (see computeWeightAxis), and a day with no
 * weigh-in is a genuine absence: it gets no dot, and the line runs
 * straight from the last real reading to the next one instead of dipping
 * toward zero or breaking apart. Points are hollow rings, so the line
 * reads as the primary shape and the readings as marks on it.
 */
export default function WeightChart({ points, targetValue }: WeightChartProps) {
  // The chart's own points always already match whichever window is on
  // screen (7 days, 30 days, ...) — StatChartPage is what slides that
  // window through time (dragging the panel it renders this into), not
  // this component, so there's nothing here to scroll: it just fits
  // whatever width its container actually has.
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    function measure() {
      const rect = containerRef.current?.getBoundingClientRect();

      if (rect) setSize({ width: rect.width, height: rect.height });
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Index is kept so a reading still lands on its own day's x position
  // even though the empty days around it contribute no point.
  const readings = points
    .map((point, index) => ({ index, value: point.value }))
    .filter((point): point is { index: number; value: number } => point.value !== null);

  const { width, height } = size;
  const ready = width > 0 && height > 0 && readings.length > 0;

  const axis = ready ? computeWeightAxis(readings.map((r) => r.value)) : null;

  const plotLeft = PADDING.left;
  const plotRight = width - PADDING.right;
  const plotTop = PADDING.top;
  const plotBottom = height - PADDING.bottom;
  const plotWidth = Math.max(0, plotRight - plotLeft);
  const plotHeight = Math.max(0, plotBottom - plotTop);

  function xFor(index: number): number {
    if (points.length <= 1) return plotLeft + plotWidth / 2;

    return plotLeft + (index / (points.length - 1)) * plotWidth;
  }

  function yFor(value: number): number {
    if (!axis || axis.max === axis.min) return plotTop + plotHeight / 2;

    return plotBottom - ((value - axis.min) / (axis.max - axis.min)) * plotHeight;
  }

  const gridValues: number[] = [];
  if (axis) {
    for (let v = axis.min; v <= axis.max + 1e-9; v += axis.step) {
      gridValues.push(Math.round(v * 100) / 100);
    }
  }

  // Only every nth day gets a label and a vertical line — 30 of either
  // would be noise rather than orientation. A week's worth (7) always
  // gets every one of its own labels instead — there's genuine room for
  // all 7 at the panel's normal width, no scrolling needed to fit them.
  const labelStride =
    points.length <= 7 ? 1 : Math.max(1, Math.ceil(points.length / MAX_X_LABELS));
  const labelIndexes = points
    .map((_, index) => index)
    .filter((index) => index % labelStride === 0);

  // One continuous polyline through the real readings only, so a gap in
  // logging is simply a longer straight segment. A single reading gets no
  // line at all — there's nothing to connect it to.
  const linePath =
    readings.length > 1
      ? readings
          .map(
            (reading, i) =>
              `${i === 0 ? "M" : "L"} ${xFor(reading.index).toFixed(2)} ${yFor(reading.value).toFixed(2)}`,
          )
          .join(" ")
      : null;

  // Rule 4: a target outside the zoomed-in axis doesn't stretch it — its
  // line pins flat against whichever edge it's past instead, so the chart
  // stays zoomed on the real data while the goal still shows up on the
  // correct side of it.
  const targetPin: "top" | "bottom" | null =
    axis && targetValue !== undefined
      ? targetValue > axis.max
        ? "top"
        : targetValue < axis.min
          ? "bottom"
          : null
      : null;

  const targetY =
    axis && targetValue !== undefined
      ? targetPin === "top"
        ? plotTop
        : targetPin === "bottom"
          ? plotBottom
          : yFor(targetValue)
      : null;

  return (
    <div ref={containerRef} className="h-full w-full">
      {ready && axis && (
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          // The document is RTL, and under that direction text-anchor="end"
          // anchors the text's *logical* end — so the Y labels grew
          // rightward off the panel and only their last digit stayed
          // visible. These are bare numbers, so forcing LTR here just
          // restores the intended right-aligned behaviour.
          style={{ direction: "ltr" }}
        >
          {gridValues.map((value) => (
            <g key={value}>
              {/* Horizontal gridlines solid and faint; the vertical ones
                  below are dashed, so the two never read as one grid. */}
              <line
                x1={plotLeft}
                y1={yFor(value)}
                x2={plotRight}
                y2={yFor(value)}
                stroke="rgb(255 255 255 / 12%)"
                strokeWidth={1}
              />

              <text
                x={width - 4}
                y={yFor(value)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fontFamily="Vazirmatn"
                fill="rgb(255 255 255 / 55%)"
              >
                {toFaDigits(value)}
              </text>
            </g>
          ))}

          {labelIndexes.map((index) => (
            <line
              key={`v-${index}`}
              x1={xFor(index)}
              y1={plotTop}
              x2={xFor(index)}
              y2={plotBottom}
              stroke="rgb(255 255 255 / 8%)"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          ))}

          {targetY !== null && (
            <g>
              <line
                x1={plotLeft}
                y1={targetY}
                x2={plotRight}
                y2={targetY}
                stroke={TARGET_COLOR}
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />

              {/* Only when pinned — an in-range target already reads
                  against the Y-axis numbers beside it, but a pinned one
                  needs to say what it actually is, since its position no
                  longer reflects the real value. Offset inward from the
                  edge so it never crowds the plot border. */}
              {targetPin && targetValue !== undefined && (
                <text
                  x={plotLeft + 4}
                  y={targetPin === "top" ? targetY + 12 : targetY - 6}
                  textAnchor="start"
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="Vazirmatn"
                  fill={TARGET_COLOR}
                >
                  {`هدف: ${toFaDigits(targetValue)}`}
                </text>
              )}
            </g>
          )}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth={LINE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {readings.map((reading) => (
            <circle
              key={reading.index}
              cx={xFor(reading.index)}
              cy={yFor(reading.value)}
              r={POINT_RADIUS}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth={LINE_WIDTH}
            />
          ))}

          {labelIndexes.map((index) => (
            <text
              key={`x-${index}`}
              x={xFor(index)}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              fontFamily="Vazirmatn"
              fill="rgb(255 255 255 / 55%)"
            >
              {points[index].label}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}
