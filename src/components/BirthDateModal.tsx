import { useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import BirthDatePicker from "@/components/BirthDatePicker";
import {
  ageFromBirthDate,
  getCurrentUserBirthDate,
  setCurrentUserBirthDate,
} from "@/utils/userEngine";
import { toFaDigits } from "@/utils/numberFormat";

// Roughly the middle of the plausible range, so a first-time user has the
// shortest distance to scroll in either direction.
const DEFAULT_BIRTH_DATE = "1995-01-01";

export interface BirthDateModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function BirthDateModal({
  open,
  onClose,
  onSaved,
}: BirthDateModalProps) {
  const [date, setDate] = useState(
    () => getCurrentUserBirthDate() ?? DEFAULT_BIRTH_DATE,
  );

  if (!open) {
    return null;
  }

  const age = ageFromBirthDate(date);

  function handleSave() {
    setCurrentUserBirthDate(date);
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">تاریخ تولد</h2>

        <BirthDatePicker value={date} onChange={setDate} />

        {/* The age is the reason this field exists — showing it live means
            the wheels are confirmed against the number they feed rather
            than being trusted blind. */}
        <p className="text-sm text-white/70">
          {age !== null ? `${toFaDigits(age)} سال` : "تاریخ نامعتبر"}
        </p>

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
