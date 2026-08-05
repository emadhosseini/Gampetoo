/**
 * Y-axis rules for the weight chart, kept out of the component so the
 * maths can be reasoned about (and checked) on its own.
 */

// Beyond this many gridlines the axis stops being readable, which is the
// whole reason the step is dynamic — see pickStep's escalation below.
const MAX_GRIDLINES = 8;
const STEP_TIERS = [1, 2, 5, 10, 20, 50];

/**
 * Step size straight from how far apart the weights in view actually are:
 * a wide spread gets coarse 5kg gridlines, a narrow one gets 1kg lines so
 * a few hundred grams of movement is still visible. A fixed step can only
 * ever suit one of those.
 */
function stepForSpread(spread: number): number {
  if (spread > 10) return 5;
  if (spread >= 5) return 2;

  return 1;
}

export interface WeightAxis {
  min: number;
  max: number;
  step: number;
}

export function computeWeightAxis(values: number[], target?: number): WeightAxis {
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  let step = stepForSpread(dataMax - dataMin);

  for (;;) {
    // Rounded outward to whole steps, then given one more step of
    // breathing room top and bottom so the trend sits in the middle of the
    // frame instead of touching its edges.
    let min = Math.floor(dataMin / step) * step - step;
    let max = Math.ceil(dataMax / step) * step + step;

    // The goal line has to stay on the chart to be worth drawing, so the
    // range stretches to it — but only while the gridlines stay readable.
    // Past that the step escalates instead, which is what stops a goal
    // 16kg away from a steady weight drawing ~18 lines a kilo apart.
    if (target !== undefined) {
      min = Math.min(min, Math.floor(target / step) * step);
      max = Math.max(max, Math.ceil(target / step) * step);
    }

    const gridlines = Math.round((max - min) / step) + 1;
    const nextStep = STEP_TIERS[STEP_TIERS.indexOf(step) + 1];

    if (gridlines <= MAX_GRIDLINES || nextStep === undefined) {
      return { min, max, step };
    }

    step = nextStep;
  }
}
