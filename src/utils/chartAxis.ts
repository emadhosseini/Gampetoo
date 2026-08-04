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

    let min = Math.round((center - span / 2) / stepSize) * stepSize;

    // Snapping the centered min to a step multiple can drop it a fraction
    // of a step below where centering put it, which pushes the data
    // proportionally higher and can fail the headroom test at a step that
    // would otherwise have been fine. Sliding min back up — never past
    // dataMin, so containment holds — recovers that headroom instead of
    // escalating the step. Without this the loop could run away: at every
    // step the freshly-snapped min re-broke headroom, so a perfectly
    // ordinary 98-101kg weight trend escalated all the way to a
    // -200..400 axis before anything satisfied both tests.
    while (
      dataMax - min > span * MAX_TOP_POSITION_FRACTION + 1e-9 &&
      min + stepSize <= dataMin + 1e-9
    ) {
      min += stepSize;
    }

    const max = min + span;

    const containsData = dataMin >= min - 1e-9 && dataMax <= max + 1e-9;
    const hasTopHeadroom = dataMax - min <= span * MAX_TOP_POSITION_FRACTION + 1e-9;

    if (containsData && hasTopHeadroom) {
      return { min, max, stepSize };
    }

    stepSize = nextNiceStep(stepSize);
  }
}

// Grows an already-computed range outward just enough to include `value`
// — for a reference/target line that may sit far outside the data's own
// range. Deliberately NOT run back through computeYAxisRange's
// centering/headroom logic: a target far from the real data should be free
// to land near an edge (that's informative — it really is far away),
// rather than dragging the whole axis's resolution down to keep it
// centered too.
//
// It does have to re-pick the step, though. Keeping the data's own step
// while stretching to a distant target is what produced ~19 gridlines at
// 1kg apart between a 101kg current weight and an 85kg goal — technically
// correct, unreadable in practice. Instead the step escalates through the
// nice-number progression until the whole span fits in `maxRows`
// gridlines, which lands that same 85–101 case on 85/90/95/100/105.
export function extendYAxisRangeToInclude(
  range: YAxisRange,
  value: number,
  maxRows: number,
): YAxisRange {
  if (value >= range.min && value <= range.max) {
    return range;
  }

  const lo = Math.min(range.min, value);
  const hi = Math.max(range.max, value);

  let stepSize = range.stepSize;

  for (;;) {
    // Snapped outward to step multiples so every gridline lands on a round
    // number (85, 90, 95…) rather than inheriting the data's arbitrary edge.
    const min = Math.floor(lo / stepSize) * stepSize;
    const max = Math.ceil(hi / stepSize) * stepSize;
    const rows = Math.round((max - min) / stepSize) + 1;

    if (rows <= maxRows) {
      return { min, max, stepSize };
    }

    stepSize = nextNiceStep(stepSize);
  }
}
