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

// Computes a Y-axis min/max/stepSize with EXACTLY `rows` gridlines
// (never fewer, so a single/flat value never collapses onto one edge),
// each at least `minStep` apart, snapped to nice round numbers, and
// centered on the data's own min/max rather than floored/ceiled outward
// from it (which would push a narrow-range value toward the bottom edge
// instead of the middle of the chart).
export function computeYAxisRange(values: number[], rows: number, minStep: number): YAxisRange {
  const finiteValues = values.filter((value) => Number.isFinite(value));

  if (finiteValues.length === 0) {
    return { min: 0, max: minStep * (rows - 1), stepSize: minStep };
  }

  const dataMin = Math.min(...finiteValues);
  const dataMax = Math.max(...finiteValues);
  const center = (dataMin + dataMax) / 2;

  let stepSize = Math.max(niceStep((dataMax - dataMin) / Math.max(rows - 1, 1)), minStep);

  // Escalates the step until a `rows`-tall span centered on the data's
  // midpoint actually contains the full data range — needed because
  // rounding the centered min to a step-grid boundary can occasionally
  // clip a fraction of a step off one side.
  for (;;) {
    const span = stepSize * (rows - 1);
    const min = Math.round((center - span / 2) / stepSize) * stepSize;
    const max = min + span;

    if (dataMin >= min - 1e-9 && dataMax <= max + 1e-9) {
      return { min, max, stepSize };
    }

    stepSize = nextNiceStep(stepSize);
  }
}
