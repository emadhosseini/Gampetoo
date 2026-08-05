import { useMemo } from "react";

import { WheelColumn } from "@/components/WheelColumn";

export interface HeightPickerProps {
  /** Initial height in cm, e.g. 175. */
  value?: number;
  onChange: (height: number) => void;
  minCm?: number;
  maxCm?: number;
  className?: string;
}

// A single-column wheel-picker for height in whole centimeters, matching
// WeightPicker's iOS-style scroll/snap feel via the same shared WheelColumn.
export default function HeightPicker({
  value = 170,
  onChange,
  minCm = 100,
  maxCm = 230,
  className = "",
}: HeightPickerProps) {
  const clampedValue = Math.round(Math.min(maxCm, Math.max(minCm, value)));

  const cmValues = useMemo(
    () => Array.from({ length: maxCm - minCm + 1 }, (_, i) => minCm + i),
    [minCm, maxCm],
  );

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <WheelColumn
        values={cmValues}
        selected={clampedValue}
        onSettle={onChange}
        className="w-20"
      />
    </div>
  );
}
