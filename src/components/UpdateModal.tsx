import { RefreshCw } from "lucide-react";

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
    <div className="pt-safe fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-navy-600 bg-navy-700 p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <RefreshCw size={22} />
        </div>

        <h2 className="mt-4 text-lg font-bold text-white">
          نسخه جدید آماده است
        </h2>

        <p className="mt-2 text-sm leading-7 text-zinc-400">
          نسخه جدید منتشر شده است.
          <br />
          برای استفاده از آخرین امکانات و رفع باگ‌ها برنامه را بروزرسانی کنید.
        </p>

        <div className="mt-4 flex items-center justify-center gap-6 rounded-xl bg-navy-600/60 py-3">
          <div className="text-center">
            <p className="text-xs text-zinc-500">نسخه فعلی</p>
            <p dir="ltr" className="mt-1 font-bold text-white">
              {currentVersion}
            </p>
          </div>

          {newVersion && (
            <div className="text-center">
              <p className="text-xs text-zinc-500">نسخه جدید</p>
              <p dir="ltr" className="mt-1 font-bold text-emerald-400">
                {newVersion}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onLater}
            disabled={updating}
            className="flex-1 rounded-2xl bg-navy-600 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            بعداً
          </button>

          <button
            onClick={onUpdate}
            disabled={updating}
            className="flex-1 rounded-2xl bg-emerald-500 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {updating ? "..." : "بروزرسانی"}
          </button>
        </div>
      </div>
    </div>
  );
}
