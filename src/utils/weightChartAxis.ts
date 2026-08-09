/**
 * Y-axis rules for the weight chart, kept out of the component so the
 * maths can be reasoned about (and checked) on its own.
 *
 * Smart Zoom: the axis is built from the logged weights in view ONLY — a
 * distant target used to stretch it to fit, which is exactly the
 * "everything looks flat" bug this fixes. A target far outside the data's
 * own spread no longer touches the axis at all; instead it's pinned to
 * whichever edge it's on the wrong side of (see WeightChart's target-pin
 * logic), so the chart stays zoomed in on the real trend while the goal
 * line still shows up, flattened against that edge with its own label.
 */

// Beyond this many gridlines the axis stops being readable, which is the
// whole reason the step is dynamic — see the escalation loop below.
const MAX_GRIDLINES = 8;
// 0.5/1kg steps zoom in on a tight cluster of readings (a few hundred
// grams of real movement is still worth seeing); 5kg is the normal ceiling
// for a wide spread, past which the escalation loop takes over so the
// grid never ends up unreadably dense on a genuinely huge range.
const STEP_TIERS = [0.5, 1, 2, 5, 10, 20, 50];

/**
 * Step size straight from how far apart the weights in view actually are:
 * under 2kg of spread gets 0.5kg gridlines, under 5kg gets 1kg, 5kg+ gets
 * the coarser 5kg step. A fixed step can only ever suit one of those — a
 * wide spread on a fine step is exactly what packs the grid with
 * unreadable lines, and a narrow spread on a coarse one is exactly what
 * flattens real movement into a straight-looking line.
 */
function stepForSpread(spread: number): number {
  if (spread < 2) return 0.5;
  if (spread < 5) return 1;

  return 5;
}

export interface WeightAxis {
  min: number;
  max: number;
  step: number;
}

export function computeWeightAxis(values: number[]): WeightAxis {
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  let step = stepForSpread(dataMax - dataMin);

  for (;;) {
    // Rounded outward to whole steps, then given one more step of padding
    // top and bottom — required, not cosmetic: without it the highest or
    // lowest reading would sit flush against the panel's own edge instead
    // of sitting clear of it with room to read.
    const min = Math.floor(dataMin / step) * step - step;
    const max = Math.ceil(dataMax / step) * step + step;

    const gridlines = Math.round((max - min) / step) + 1;
    const nextStep = STEP_TIERS[STEP_TIERS.indexOf(step) + 1];

    if (gridlines <= MAX_GRIDLINES || nextStep === undefined) {
      return { min, max, step };
    }

    step = nextStep;
  }
}
