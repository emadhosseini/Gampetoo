import { getHistoryFor, type MeasurementType } from "./bodyMeasurementsEngine";

// The body regions BodySilhouette actually draws as their own measured
// shape — a subset of MeasurementType (chest/shoulder width and the torso
// midline both read off "chest" and "upperAbdomen"; there's no separate
// "shoulder" measurement to track).
export type BodyShapeRegion =
  | "chest"
  | "upperAbdomen"
  | "waist"
  | "hip"
  | "arm"
  | "wrist"
  | "thigh"
  | "calf";

// Real centimeters, NOT a ratio — see the note on the old `BodyShapeScales`
// below for why. BodySilhouette converts these straight to pixels with one
// shared cm-per-pixel constant, so a 41cm calf and a 19cm wrist land at
// proportionally different sizes no matter what either started from.
export type BodyShapeValues = Record<BodyShapeRegion, number>;

const REGIONS: BodyShapeRegion[] = [
  "chest",
  "upperAbdomen",
  "waist",
  "hip",
  "arm",
  "wrist",
  "thigh",
  "calf",
];

// A rough adult-average circumference per region, in cm — the value used
// for a region with nothing logged yet (an "average build" placeholder,
// not a target), and the center each region's clamp range below is built
// around.
//
// This used to also be the denominator of a per-region ratio (value ÷
// reference), and the *ratio* — not the cm value — was what got turned
// into pixels. That silently broke comparisons between regions: a 19cm
// wrist against its own 17cm reference is a ratio of ~1.12, and a 41cm
// calf against ITS 37cm reference is ~1.11 — almost identical ratios for
// two wildly different real sizes, so the wrist rendered about as thick as
// the calf. Converting the raw cm value straight to pixels (below) doesn't
// have that failure mode: sizes only ever compare to each other, never to
// a region-specific denominator first.
const REFERENCE_CM: Record<BodyShapeRegion, number> = {
  chest: 100,
  upperAbdomen: 85,
  waist: 85,
  hip: 95,
  arm: 30,
  wrist: 17,
  thigh: 55,
  calf: 37,
};

// However far a real measurement sits from its reference, the value fed to
// the silhouette never goes past this multiple of it — keeps one extreme
// or mistyped entry from distorting the figure into something
// unrecognizable.
const MIN_RATIO = 0.6;
const MAX_RATIO = 1.7;

function clamp(value: number, region: BodyShapeRegion): number {
  const reference = REFERENCE_CM[region];

  return Math.max(reference * MIN_RATIO, Math.min(reference * MAX_RATIO, value));
}

function valueFor(type: MeasurementType, useFirst: boolean): number {
  const history = getHistoryFor(type);

  if (history.length === 0) return REFERENCE_CM[type as BodyShapeRegion];

  const entry = useFirst ? history[0] : history[history.length - 1];

  return clamp(entry.value, type as BodyShapeRegion);
}

/** Each region's LATEST logged cm value (or the reference, if unset) — "the shape right now". */
export function getBodyShapeValues(): BodyShapeValues {
  const values = {} as BodyShapeValues;

  for (const region of REGIONS) {
    values[region] = valueFor(region as MeasurementType, false);
  }

  return values;
}

/**
 * Each region's FIRST logged cm value (or the reference, if unset) — "the
 * shape when tracking started" — for BodySilhouette's `baselineValues`
 * ghost outline, so a real change over time reads directly on the figure.
 */
export function getBodyShapeBaselineValues(): BodyShapeValues {
  const values = {} as BodyShapeValues;

  for (const region of REGIONS) {
    values[region] = valueFor(region as MeasurementType, true);
  }

  return values;
}

/** True once at least one of the eight measurements has ever been logged. */
export function hasAnyBodyShapeData(): boolean {
  return REGIONS.some((region) => getHistoryFor(region as MeasurementType).length > 0);
}

/**
 * True once at least one region has two or more logged entries on
 * different dates — i.e. there's an actual first-vs-latest change to show,
 * not just one reading repeated as both ends of the comparison.
 */
export function hasBodyShapeChange(): boolean {
  return REGIONS.some((region) => {
    const history = getHistoryFor(region as MeasurementType);

    return history.length >= 2 && history[0].value !== history[history.length - 1].value;
  });
}

// ---------------------------------------------------------------------------
// Anthropometric estimation — turning the 8 logged circumferences into the
// front-view HALF-widths BodySilhouette actually draws, including the joints
// nobody ever measures (knee, ankle, shoulder breadth). Deliberately still
// unitless "cm-equivalent" numbers, not pixels — how many pixels a
// centimeter gets is a rendering choice, made in BodySilhouette, not here.
// ---------------------------------------------------------------------------

/**
 * A limb (arm/wrist/thigh/calf) reads as roughly circular in cross-section,
 * so its front-view width is its diameter: circumference ÷ π.
 */
function cylinderWidth(circumferenceCm: number): number {
  return circumferenceCm / Math.PI;
}

/**
 * The torso (chest/waist/hip) is flatter front-to-back than it is wide
 * side-to-side — an ellipse, not a circle — so circumference ÷ π
 * (which assumes a circle) understates its real front-view width. 1.25 is
 * a commonly used correction for a torso's typical width:depth ratio.
 */
function ellipseWidth(circumferenceCm: number): number {
  return (circumferenceCm / Math.PI) * 1.25;
}

/**
 * Knee circumference sits between calf and thigh, much closer to the
 * calf's — the kneecap is a narrow joint, not a muscle bulk like either
 * neighbor.
 */
function estimateKneeCircumference(thighCm: number, calfCm: number): number {
  return calfCm + 0.15 * (thighCm - calfCm);
}

/** Ankle circumference is consistently a good deal narrower than the calf. */
function estimateAnkleCircumference(calfCm: number): number {
  return calfCm * 0.68;
}

/**
 * Shoulder-to-shoulder breadth (front view) as the torso's own width at
 * chest height plus one arm's width on each side — the shoulder joint sits
 * right at that outer edge, so the two nearly stack directly.
 */
function estimateShoulderWidth(chestCm: number, armCm: number): number {
  return ellipseWidth(chestCm) + cylinderWidth(armCm);
}

// Elbow circumference isn't logged and doesn't have a named estimation rule
// from anywhere — it sits between the bicep and the wrist, so it's read as
// their midpoint the same way a knee reads as (mostly) the calf's.
function estimateElbowCircumference(armCm: number, wristCm: number): number {
  return (armCm + wristCm) / 2;
}

export interface BodyShapeWidths {
  shoulder: number;
  chest: number;
  upperAbdomen: number;
  waist: number;
  hip: number;
  arm: number;
  elbow: number;
  wrist: number;
  thigh: number;
  knee: number;
  calf: number;
  ankle: number;
}

/**
 * Every half-width BodySilhouette needs to draw the figure, derived from
 * the 8 logged circumferences via the estimation rules above. "Half"
 * because torso widths are measured from the body's own centerline and
 * limb widths are half a limb's own thickness — both are what a symmetric,
 * mirrored outline needs on each side.
 */
export function computeBodyShapeWidths(values: BodyShapeValues): BodyShapeWidths {
  const kneeCm = estimateKneeCircumference(values.thigh, values.calf);
  const ankleCm = estimateAnkleCircumference(values.calf);
  const elbowCm = estimateElbowCircumference(values.arm, values.wrist);
  const shoulderWidthCm = estimateShoulderWidth(values.chest, values.arm);

  return {
    shoulder: shoulderWidthCm / 2,
    chest: ellipseWidth(values.chest) / 2,
    upperAbdomen: ellipseWidth(values.upperAbdomen) / 2,
    waist: ellipseWidth(values.waist) / 2,
    hip: ellipseWidth(values.hip) / 2,
    arm: cylinderWidth(values.arm) / 2,
    elbow: cylinderWidth(elbowCm) / 2,
    wrist: cylinderWidth(values.wrist) / 2,
    thigh: cylinderWidth(values.thigh) / 2,
    knee: cylinderWidth(kneeCm) / 2,
    calf: cylinderWidth(values.calf) / 2,
    ankle: cylinderWidth(ankleCm) / 2,
  };
}
