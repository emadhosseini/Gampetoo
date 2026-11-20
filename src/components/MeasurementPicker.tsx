import { useMemo, useState } from "react";

import { WheelColumn } from "@/components/WheelColumn";
import { toFaDigits } from "@/utils/numberFormat";

export interface MeasurementPickerProps {
  /** Initial value in cm, e.g. 33.5. */
  value?: number;
  onChange: (cm: number) => void;
  minCm?: number;
  maxCm?: number;
  className?: string;
}

// A body-circumference wheel-picker: whole centimeters on the left, one
// decimal digit on the right — same dual-wheel shell as WeightPicker, just
// one digit of precision instead of two (a tape measure doesn't read to the
// millimeter).
export default function MeasurementPicker({
  value = 40,
  onChange,
  minCm = 10,
  maxCm = 200,
  className = "",
}: MeasurementPickerProps) {
  const clampedValue = Math.min(maxCm, Math.max(minCm, value));
  const initialCm = Math.floor(clampedValue);
  const initialDecimal = Math.round((clampedValue - initialCm) * 10);

  const [cm, setCm] = useState(initialCm);
  const [decimal, setDecimal] = useState(initialDecimal);

  const cmValues = useMemo(
    () => Array.from({ length: maxCm - minCm + 1 }, (_, i) => minCm + i),
    [minCm, maxCm],
  );

  const decimalValues = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);

  function handleCmSettle(newCm: number) {
    setCm(newCm);
    onChange(Number((newCm + decimal / 10).toFixed(1)));
  }

  function handleDecimalSettle(newDecimal: number) {
    setDecimal(newDecimal);
    onChange(Number((cm + newDecimal / 10).toFixed(1)));
  }

  return (
    // dir="ltr" for the same reason as WeightPicker: keeps the whole-number
    // column to the left of the decimal point regardless of the page's RTL
    // direction.
    <div dir="ltr" className={`flex items-center justify-center ${className}`}>
      <WheelColumn
        values={cmValues}
        selected={initialCm}
        onSettle={handleCmSettle}
        className="w-16"
      />

      <span className="pb-1 text-2xl font-bold text-white">.</span>

      <WheelColumn
        values={decimalValues}
        selected={initialDecimal}
        onSettle={handleDecimalSettle}
        format={(v) => toFaDigits(v)}
        className="w-14"
      />
    </div>
  );
}
