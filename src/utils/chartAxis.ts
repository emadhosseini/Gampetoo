// The next step in the "nice number" progression (1, 2, 5, 10, 20, 50, ...
// scaled by powers of ten) — the same rounding rule most charting libraries
// use internally for axis ticks.
function nextNiceStep(step: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(step));
  const residual = Math.round((step / magnitude) * 100) / 100;

  if (residual < 2) return 2 * magnitude;
  if (residual < 5) return 5 * magnitude;

  return 10 * magnitude;
}

function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 1;

  // Start one tier below rawStep and escalate — guarantees the result is
  // always one of the canonical 1/2/5/10× values, never an arbitrary
  // in-between number from rounding rawStep directly.
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  let step = magnitude;

  while (step < rawStep) {
    step = nextNiceStep(step);
  }

  return step;
}

export interface YAxisRange {
  min: number;
  max: number;
  stepSize: number;
}

// Computes a Y-axis min/max/stepSize so the chart shows at most `maxRows`
// gridlines, each at least `minStep` apart, snapped to nice round numbers.
// Flooring/ceiling the data range out to step boundaries can add up to one
// extra tick beyond what the initial step estimate implied (e.g. a range
// of 1.65 with a 1-unit step spans 90→93, which is 4 ticks, not 3) — so the
// step is escalated, not just picked once, until the actual resulting tick
// count fits within maxRows.
export function computeYAxisRange(
  values: number[],
  maxRows: number,
  minStep: number,
): YAxisRange {
  if (values.length === 0) {
    return { min: 0, max: minStep * maxRows, stepSize: minStep };
  }

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = Math.max(dataMax - dataMin, minStep);

  let stepSize = Math.max(niceStep(range / Math.max(maxRows - 1, 1)), minStep);

  let min = Math.floor(dataMin / stepSize) * stepSize;
  let max = Math.ceil(dataMax / stepSize) * stepSize;

  // Guarantees at least one full step of headroom even when every value is
  // identical (a flat line would otherwise land exactly on both min and max).
  if (max - min < stepSize) max = min + stepSize;

  while (Math.round((max - min) / stepSize) + 1 > maxRows) {
    stepSize = nextNiceStep(stepSize);
    min = Math.floor(dataMin / stepSize) * stepSize;
    max = Math.ceil(dataMax / stepSize) * stepSize;
    if (max - min < stepSize) max = min + stepSize;
  }

  return { min, max, stepSize };
}
