// Shared BMI semicircle-gauge geometry — used by both WeightGaugeCard (the
// progress-page tile) and WeightProgressRow's dashboard gauge, so the two
// draw the exact same dial instead of two copies that could drift.

// WHO categories, same thresholds as ProfilePage's BMI card. 15–40 spans
// comfortably past both outer zones so the pointer never pins to an end
// for realistic values.
export const BMI_MIN = 15;
export const BMI_MAX = 40;

export interface BmiZone {
  from: number;
  to: number;
  label: string;
  color: string;
}

export const BMI_ZONES: BmiZone[] = [
  { from: BMI_MIN, to: 18.5, label: "کم‌وزن", color: "#38bdf8" },
  { from: 18.5, to: 25, label: "طبیعی", color: "#4ade80" },
  { from: 25, to: 30, label: "اضافه‌وزن", color: "#fbbf24" },
  { from: 30, to: BMI_MAX, label: "چاق", color: "#f87171" },
];

// Semicircle geometry: center (100,100), arc over the top from 180° (left)
// to 0° (right) — mapped so BMI_MIN sits at the left end.
export const GAUGE_CX = 100;
export const GAUGE_CY = 100;
export const GAUGE_RADIUS = 84;
export const GAUGE_STROKE = 13;

// Degrees shaved off each side of every zone arc, so the segments read as
// separate pills instead of one joined band. Has to clear more than just
// the raw path endpoints: strokeLinecap="round" adds a semicircular cap
// extending STROKE/2 (6.5 units) past each segment's literal endpoint, and
// that's what actually has to stay clear of the neighboring segment's own
// cap. At GAUGE_RADIUS (84), the two facing gaps need 2×GAP° of combined
// arc length to exceed 2×6.5=13 units before any real gap shows — which
// needs GAP > ~4.43°. 6° clears it with margin.
export const SEGMENT_GAP_DEG = 6;

export function calculateBmi(weightKg: number, heightCm: number): number {
  return weightKg / (heightCm / 100) ** 2;
}

export function findBmiZone(bmi: number): BmiZone {
  return BMI_ZONES.find((zone) => bmi < zone.to) ?? BMI_ZONES[BMI_ZONES.length - 1];
}

export function bmiToAngle(bmi: number): number {
  const clamped = Math.min(BMI_MAX, Math.max(BMI_MIN, bmi));

  return 180 - ((clamped - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 180;
}

export function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;

  return { x: GAUGE_CX + radius * Math.cos(rad), y: GAUGE_CY - radius * Math.sin(rad) };
}

export function arcPath(fromDeg: number, toDeg: number): string {
  const start = polar(fromDeg, GAUGE_RADIUS);
  const end = polar(toDeg, GAUGE_RADIUS);

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}
