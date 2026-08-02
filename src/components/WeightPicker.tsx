import { useMemo, useState } from "react";

import { WheelColumn } from "@/components/WheelColumn";
import { toFaDigits } from "@/utils/numberFormat";

export interface WeightPickerProps {
  /** Initial weight in kg, e.g. 75.5. */
  value?: number;
  onChange: (weight: number) => void;
  minKg?: number;
  maxKg?: number;
  className?: string;
}

// An iOS-style dual wheel-picker for weight: kg (whole number) on the left,
// grams (two digits) on the right, separated by a decimal point. Each column
// is its own native-scrolling wheel — momentum, touch, and snap-to-center
// all come from the browser, so it feels identical to a native picker on
// both iOS and Android without hand-rolled drag physics.
export default function WeightPicker({
  value = 70,
  onChange,
  minKg = 0,
  maxKg = 250,
  className = "",
}: WeightPickerProps) {
  const clampedValue = Math.min(maxKg, Math.max(minKg, value));
  const initialKg = Math.floor(clampedValue);
  const initialGrams = Math.round((clampedValue - initialKg) * 100);

  const [kg, setKg] = useState(initialKg);
  const [grams, setGrams] = useState(initialGrams);

  const kgValues = useMemo(
    () => Array.from({ length: maxKg - minKg + 1 }, (_, i) => minKg + i),
    [minKg, maxKg],
  );

  const gramValues = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);

  function handleKgSettle(newKg: number) {
    setKg(newKg);
    onChange(Number((newKg + grams / 100).toFixed(2)));
  }

  function handleGramSettle(newGrams: number) {
    setGrams(newGrams);
    onChange(Number((kg + newGrams / 100).toFixed(2)));
  }

  return (
    // dir="ltr" keeps kg-then-grams in natural numeric reading order (e.g.
    // "70.00") — without it, the page's global RTL direction reverses the
    // flex order and puts grams on the left of the decimal point.
    <div dir="ltr" className={`flex items-center justify-center ${className}`}>
      <WheelColumn
        values={kgValues}
        selected={initialKg}
        onSettle={handleKgSettle}
        className="w-16"
      />

      <span className="text-forest-900 pb-1 text-2xl font-bold">.</span>

      <WheelColumn
        values={gramValues}
        selected={initialGrams}
        onSettle={handleGramSettle}
        format={(v) => toFaDigits(v.toString().padStart(2, "0"))}
        className="w-14"
      />
    </div>
  );
}
