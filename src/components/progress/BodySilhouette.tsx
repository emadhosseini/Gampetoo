import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { computeBodyShapeWidths, type BodyShapeValues } from "@/utils/bodyShapeEngine";

export interface BodySilhouetteProps {
  values: BodyShapeValues;
  // Draws a second, dashed "ghost" outline behind the current one — the
  // shape at some earlier point (see bodyShapeEngine.getBodyShapeBaselineValues,
  // built from each region's FIRST logged value), so the current shape's
  // change over time reads directly on the figure instead of needing a
  // separate before/after chart.
  baselineValues?: BodyShapeValues;
  className?: string;
}

type Point = [number, number];

const CX = 220;
const SHOULDER_Y = 88;

// Pixels per cm-equivalent width unit coming out of bodyShapeEngine's
// computeBodyShapeWidths — the one place real-world size becomes an
// on-screen size. Everything upstream of this (the π-based
// circumference→width conversion, the knee/ankle/shoulder estimates) is
// pure anthropometric math with no notion of pixels.
const SCALE = 2.4;

// Structural half-widths/offsets nobody logs a measurement for, so there's
// no anthropometric rule to derive them from — already in the same scaled
// pixel space as everything else.
const NECK_HALF = 10;
const HAND_HALF = 9;
const FOOT_HALF = 9;
// How tight the armpit notch is — not a measurement, a pose parameter (how
// close the raised arm sits to the torso at its narrowest point).
const ARMPIT_HALF = 11;
// How far each leg's own centerline sits from the body's — legs stay
// close together (a stance, not a measurement), and each leg's actual
// thigh/knee/calf/ankle width is added on top of this rather than
// replacing it, via the same clamp: never lets an inner edge cross past
// the body's centerline even for a very wide thigh.
const LEG_STANCE = 24;

// The arm: one straight line from the shoulder out to the hand, ~45° below
// the horizontal.
const ARM_ANGLE = (44 * Math.PI) / 180;
const ARM_LENGTH = 150;

function px(cmEquivalent: number): number {
  return cmEquivalent * SCALE;
}

// A smooth closed curve THROUGH every point (not just near them) — the
// standard uniform Catmull-Rom → cubic-Bezier conversion, cyclic so the
// curve wraps around a closed shape instead of needing real start/end
// tangents. This is what keeps a joint like the hip-to-thigh transition
// reading as one continuous curve instead of a robotic, faceted corner.
function catmullRomClosedPath(points: Point[]): string {
  const n = points.length;

  if (n < 3) return "";

  const at = (i: number) => points[(i + n) % n];

  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)} `;

  for (let i = 0; i < n; i++) {
    const p1 = at(i);
    const p0 = at(i - 1);
    const p2 = at(i + 1);
    const p3 = at(i + 2);

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }

  return `${d}Z `;
}

/**
 * The ENTIRE right half of the figure — arm included — as one walked
 * boundary: neck → out along the top/outer edge of the arm to the hand →
 * back along the bottom/inner edge of the arm to the armpit notch → down
 * the torso's side (chest/upper-abdomen/waist/hip) → down the outside of
 * the leg → back up the inside of the leg, ending near the crotch.
 *
 * Two earlier versions drew the arm as its OWN shape overlapping the
 * torso's. Both failed for the same underlying reason: a silhouette is
 * "one shape," but the UNION of two separately-closed shapes has its own
 * boundary, and wherever the two shapes' edges cross near each other
 * (never exactly coincident) that union boundary dips inward between the
 * two — a real, visible notch between "the torso's own bump" and "the
 * arm's own bump," no matter how much overlap there is underneath. There
 * is no fix for that as long as they're two shapes. Folding the arm into
 * the SAME walked boundary as the torso removes the seam by construction —
 * there's only ever one edge, because there's only ever one shape.
 */
function bodyPoints(values: BodyShapeValues): Point[] {
  const w = computeBodyShapeWidths(values);

  const originDx = px(w.shoulder);
  const dirx = Math.cos(ARM_ANGLE);
  const diry = Math.sin(ARM_ANGLE);
  // Perpendicular to the arm's direction: "outer" points up-and-away from
  // the body as the arm slopes down, "inner" points back down-and-toward
  // it (in the direction that continues into the armpit notch).
  const outerPerpDx = diry;
  const outerPerpDy = -dirx;
  const innerPerpDx = -diry;
  const innerPerpDy = dirx;

  const armOuter = (t: number, half: number): Point => [
    originDx + dirx * t + outerPerpDx * half,
    SHOULDER_Y + diry * t + outerPerpDy * half,
  ];
  const armInner = (t: number, half: number): Point => [
    originDx + dirx * t + innerPerpDx * half,
    SHOULDER_Y + diry * t + innerPerpDy * half,
  ];

  const capHalf = Math.max(9, px(w.arm) * 1.3); // deltoid cap
  const bicepHalf = px(w.arm);
  const elbowHalf = px(w.elbow);
  const wristHalf = px(w.wrist);

  const thighHalf = px(w.thigh);
  const kneeHalf = px(w.knee);
  const calfHalf = px(w.calf);
  const ankleHalf = px(w.ankle);

  return [
    [NECK_HALF, 66],
    armOuter(0, capHalf),
    armOuter(ARM_LENGTH * 0.3, bicepHalf),
    armOuter(ARM_LENGTH * 0.6, elbowHalf),
    armOuter(ARM_LENGTH * 0.85, wristHalf),
    armOuter(ARM_LENGTH, HAND_HALF),
    armInner(ARM_LENGTH, HAND_HALF),
    armInner(ARM_LENGTH * 0.85, wristHalf),
    armInner(ARM_LENGTH * 0.6, elbowHalf),
    armInner(ARM_LENGTH * 0.3, bicepHalf),
    armInner(0, ARMPIT_HALF),
    [px(w.chest), 124],
    [px(w.upperAbdomen), 158],
    [px(w.waist), 188],
    [px(w.hip), 218],
    [LEG_STANCE + thighHalf, 280],
    [LEG_STANCE + kneeHalf, 330],
    [LEG_STANCE + calfHalf, 372],
    [LEG_STANCE + ankleHalf, 432],
    [LEG_STANCE + FOOT_HALF, 452],
    [Math.max(4, LEG_STANCE - FOOT_HALF), 452],
    [Math.max(4, LEG_STANCE - ankleHalf), 432],
    [Math.max(4, LEG_STANCE - calfHalf), 372],
    [Math.max(4, LEG_STANCE - kneeHalf), 330],
    [Math.max(4, LEG_STANCE - thighHalf), 248],
  ].map(([dx, y]) => [dx, y] as Point);
}

/**
 * The full outline: the right half above, then the same points mirrored
 * and walked in reverse for the left half — continuing the boundary up the
 * inside of the other leg, out its outside, up its torso side, into its
 * armpit, out along its arm, and back to the neck, closing the loop. No
 * explicit "crotch" or "top-of-head" vertex joining the two sides — each
 * one's own last/first point butts directly against its mirror, and
 * Catmull-Rom closes the small gap as one smooth curve instead of the
 * sharp spike an explicit shared vertex produced in earlier attempts.
 */
function buildOutline(values: BodyShapeValues): string {
  const right = bodyPoints(values);
  const left: Point[] = right
    .slice()
    .reverse()
    .map(([dx, y]) => [-dx, y]);

  const points: Point[] = [...right, ...left].map(([dx, y]) => [CX + dx, y]);

  return catmullRomClosedPath(points);
}

const FILL = "rgb(255 255 255 / 20%)";
const GHOST_STROKE = "rgb(255 255 255 / 40%)";

/**
 * A stylized, front-facing body silhouette, arms open at ~45°, as a SINGLE
 * closed path — head, torso, both arms, and both legs are all one
 * continuous boundary (see bodyPoints), not separate overlapping shapes,
 * so there's no seam for two edges to ever cross near each other.
 *
 * Scaled from `values` (see bodyShapeEngine.getBodyShapeValues) via
 * computeBodyShapeWidths, which turns each logged circumference into a
 * front-view width (and estimates the joints nobody logs — knee, ankle,
 * shoulder breadth — from the ones that are). When `values` changes, the
 * outline animates to its new shape (framer-motion interpolates the two
 * path strings point-by-point, since both always have the same structure)
 * instead of jumping.
 */
export default function BodySilhouette({ values, baselineValues, className }: BodySilhouetteProps) {
  const reducedMotion = useReducedMotion();
  const outline = useMemo(() => buildOutline(values), [values]);
  const baselineOutline = useMemo(
    () => (baselineValues ? buildOutline(baselineValues) : null),
    [baselineValues],
  );

  return (
    <svg viewBox="0 0 440 480" className={className}>
      {baselineOutline && (
        <path
          d={baselineOutline}
          fill="none"
          stroke={GHOST_STROKE}
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />
      )}

      <motion.path
        d={outline}
        fill={FILL}
        animate={{ d: outline }}
        transition={{ duration: reducedMotion ? 0 : 0.5, ease: "easeInOut" }}
      />
      <circle cx={CX} cy={38} r={25} fill={FILL} />
    </svg>
  );
}
