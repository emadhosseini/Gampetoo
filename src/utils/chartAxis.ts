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

// The highest value's own point may never sit above this fraction of the
// chart height — i.e. the top third always stays empty headroom instead
// of the latest/highest value pinning itself to the ceiling.
const MAX_TOP_POSITION_FRACTION = 2 / 3;

// Computes a Y-axis min/max/stepSize with EXACTLY `rows` gridlines
// (never fewer, so a single/flat value never collapses onto one edge),
// each at least `minStep` apart, snapped to nice round numbers, and
// centered on the data's own min/max rather than floored/ceiled outward
// from it (which would push a narrow-range value toward an edge instead
// of the middle of the chart). A pure midpoint-center can still land the
// data's max exactly on the top gridline when the range is wide relative
// to the span (e.g. a distant target line pulls the center down) — the
// headroom check below escalates further in that case specifically.
export function computeYAxisRange(values: number[], rows: number, minStep: number): YAxisRange {
  const finiteValues = values.filter((value) => Number.isFinite(value));

  if (finiteValues.length === 0) {
    return { min: 0, max: minStep * (rows - 1), stepSize: minStep };
  }

  const dataMin = Math.min(...finiteValues);
  const dataMax = Math.max(...finiteValues);
  const center = (dataMin + dataMax) / 2;

  let stepSize = Math.max(niceStep((dataMax - dataMin) / Math.max(rows - 1, 1)), minStep);

  for (;;) {
    const span = stepSize * (rows - 1);
    const min = Math.round((center - span / 2) / stepSize) * stepSize;
    const max = min + span;

    const containsData = dataMin >= min - 1e-9 && dataMax <= max + 1e-9;
    const hasTopHeadroom = dataMax - min <= span * MAX_TOP_POSITION_FRACTION + 1e-9;

    if (containsData && hasTopHeadroom) {
      return { min, max, stepSize };
    }

    stepSize = nextNiceStep(stepSize);
  }
}

// Grows an already-computed range outward (in stepSize increments, so
// gridlines stay evenly spaced) just enough to include `value` — for a
// reference/target line that may sit far outside the data's own range.
// Deliberately NOT run back through computeYAxisRange's centering/headroom
// logic: a target far from the real data should be free to land near an
// edge (that's informative — it really is far away), rather than dragging
// the whole axis's resolution down to keep it centered too.
export function extendYAxisRangeToInclude(range: YAxisRange, value: number): YAxisRange {
  let { min, max } = range;
  const { stepSize } = range;

  while (value < min) min -= stepSize;
  while (value > max) max += stepSize;

  return { min, max, stepSize };
}
