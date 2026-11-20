import { useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import MeasurementPicker from "@/components/MeasurementPicker";
import {
  MEASUREMENT_LABELS,
  MEASUREMENT_RANGES,
  getLatestValue,
  logMeasurement,
  type MeasurementType,
} from "@/utils/bodyMeasurementsEngine";

export interface BodyMeasurementModalProps {
  type: MeasurementType;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// One shared modal for all eight measurement types — same shell as
// WeightModal, just generic over `type` instead of being weight-specific.
export default function BodyMeasurementModal({
  type,
  open,
  onClose,
  onSaved,
}: BodyMeasurementModalProps) {
  const range = MEASUREMENT_RANGES[type];
  const [value, setValue] = useState(() => getLatestValue(type) ?? Math.round((range.minCm + range.maxCm) / 2));

  if (!open) {
    return null;
  }

  function handleSave() {
    logMeasurement(type, value);
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">{MEASUREMENT_LABELS[type]}</h2>

        <MeasurementPicker
          value={value}
          onChange={setValue}
          minCm={range.minCm}
          maxCm={range.maxCm}
        />

        <button
          onClick={handleSave}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white"
        >
          ذخیره
        </button>

        <button
          onClick={onClose}
          className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
        >
          بستن
        </button>
      </div>
    </ModalOverlay>
  );
}
