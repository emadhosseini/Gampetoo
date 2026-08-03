import { RefreshCw } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";

export interface UpdateModalProps {
  open: boolean;
  currentVersion: string;
  newVersion: string | null;
  updating: boolean;
  onLater: () => void;
  onUpdate: () => void;
}

// Pure UI — no update logic here, only props in / callbacks out — so the look
// can be redesigned freely without touching updateManager or usePwaUpdate.
export default function UpdateModal({
  open,
  currentVersion,
  newVersion,
  updating,
  onLater,
  onUpdate,
}: UpdateModalProps) {
  if (!open) {
    return null;
  }

  return (
    // No backdrop-tap-to-close — this choice (later/update) should be
    // explicit, not accidentally dismissed by a stray tap outside the card.
    <ModalOverlay onClose={() => {}}>
      <div className="glass-panel glass-static rounded-3xl p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-avocado-yellow/10 text-avocado-yellow">
          <RefreshCw size={22} />
        </div>

        <h2 className="mt-4 text-lg font-bold text-white">
          نسخه جدید آماده است
        </h2>

        <p className="mt-2 text-sm leading-7 text-white">
          نسخه جدید منتشر شده است.
          <br />
          برای استفاده از آخرین امکانات و رفع باگ‌ها برنامه را بروزرسانی کنید.
        </p>

        <div className="mt-4 flex items-center justify-center gap-6 glass-chip rounded-xl py-3">
          <div className="text-center">
            <p className="text-xs text-white">نسخه فعلی</p>
            <p dir="ltr" className="mt-1 font-bold text-white">
              {currentVersion}
            </p>
          </div>

          {newVersion && (
            <div className="text-center">
              <p className="text-xs text-white">نسخه جدید</p>
              <p dir="ltr" className="mt-1 font-bold text-white">
                {newVersion}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onLater}
            disabled={updating}
            className="ghost-action flex-1 rounded-2xl py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            بعداً
          </button>

          <button
            onClick={onUpdate}
            disabled={updating}
            className="flex-1 rounded-2xl glass-action py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {updating ? "..." : "بروزرسانی"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
