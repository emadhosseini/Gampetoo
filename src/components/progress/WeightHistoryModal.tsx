import { X } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import { deleteWeightEntry, getWeightLog } from "@/utils/weightEngine";
import { formatGregorianShort } from "@/utils/dateFormat";
import { toFaDigits } from "@/utils/numberFormat";

function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);

  return new Date(y, m - 1, d);
}

export interface WeightHistoryModalProps {
  open: boolean;
  onClose: () => void;
  // Bumped after a deletion so the chart/rows behind this modal (whose own
  // state was read before it opened) show the fresh list once this closes.
  onChange: () => void;
}

export default function WeightHistoryModal({
  open,
  onClose,
  onChange,
}: WeightHistoryModalProps) {
  if (!open) {
    return null;
  }

  // Newest first — matches how someone scanning a history list expects to
  // find their most recent entries, unlike the chart's oldest-first order.
  const entries = [...getWeightLog()].sort((a, b) => (a.date < b.date ? 1 : -1));

  function handleDelete(id: string) {
    deleteWeightEntry(id);
    onChange();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">تاریخچه وزن</h2>

        {entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-white">هنوز وزنی ثبت نکردی.</p>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="glass-chip flex items-center gap-2 rounded-xl p-3"
              >
                <span className="flex-1 text-sm text-white/70">
                  {formatGregorianShort(isoToLocalDate(entry.date))}
                </span>

                <span className="text-sm font-semibold text-white">
                  {toFaDigits(entry.weight)} کیلوگرم
                </span>

                <button
                  onClick={() => handleDelete(entry.id)}
                  aria-label={`حذف وزن ${formatGregorianShort(isoToLocalDate(entry.date))}`}
                  className="glass-tap flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

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
