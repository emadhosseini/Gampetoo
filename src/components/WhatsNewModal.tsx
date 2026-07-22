export interface WhatsNewModalProps {
  open: boolean;
  version: string;
  highlights: string[];
  onClose: () => void;
}

// Pure UI, no logic — see whatsNewManager/useWhatsNew for when/why this opens.
export default function WhatsNewModal({
  open,
  version,
  highlights,
  onClose,
}: WhatsNewModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="pt-safe fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-forest-600 bg-forest-700 p-6 text-center shadow-2xl">
        <h2 className="text-lg font-bold text-white">
          🎉 تغییرات این نسخه
        </h2>

        <p dir="ltr" className="mt-1 text-xs text-zinc-300">
          {version}
        </p>

        <ul className="mt-4 space-y-3">
          {highlights.map((item) => (
            <li
              key={item}
              className="rounded-xl bg-forest-600/60 px-4 py-3 text-right text-sm text-zinc-200"
            >
              {item}
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-avocado-yellow py-3 text-lg font-bold text-black"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
}
