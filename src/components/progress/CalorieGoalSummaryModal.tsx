import ModalOverlay from "@/components/ModalOverlay";
import { toFaDigits } from "@/utils/numberFormat";

export interface CalorieGoalSummaryModalProps {
  open: boolean;
  onClose: () => void;
  onChange: () => void;
  calorieTarget: number;
  proteinGrams: number | null;
}

// The read-only view opened by tapping "باقیمانده کالری مجاز امروز" on the
// dashboard when a target is already set — shows what's currently in
// effect, with "تغییر" handing off to the exact same manual-vs-calculate
// flow CalorieGoalCard's own pencil button opens (see its Screen state
// machine, which this shares by delegating rather than duplicating).
export default function CalorieGoalSummaryModal({
  open,
  onClose,
  onChange,
  calorieTarget,
  proteinGrams,
}: CalorieGoalSummaryModalProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">کالری هدف</h2>

        <div className="space-y-3">
          <div className="glass-chip rounded-2xl p-3">
            <p className="text-xs text-white/60">کالری هدف روزانه</p>
            <p className="mt-0.5 text-xl font-bold text-white">
              {toFaDigits(calorieTarget)}{" "}
              <span className="text-sm font-normal text-white/60">کالری</span>
            </p>
          </div>

          <div className="glass-chip rounded-2xl p-3">
            <p className="text-xs text-white/60">پروتئین مورد نیاز روزانه</p>
            <p className="mt-0.5 text-xl font-bold text-white">
              {proteinGrams !== null ? (
                <>
                  {toFaDigits(proteinGrams)}{" "}
                  <span className="text-sm font-normal text-white/60">گرم</span>
                </>
              ) : (
                <span className="text-sm font-normal text-white/60">
                  برای این، اول وزنت رو ثبت کن
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onChange}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white"
        >
          تغییر
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
