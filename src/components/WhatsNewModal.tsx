import ModalOverlay from "@/components/ModalOverlay";

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
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">
          🎉 تغییرات این نسخه
        </h2>

        <p dir="ltr" className="mt-1 text-xs text-white">
          {version}
        </p>

        <ul className="mt-4 space-y-3">
          {highlights.map((item) => (
            <li
              key={item}
              className="glass-chip rounded-xl px-4 py-3 text-right text-sm text-white"
            >
              {item}
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl glass-action py-3 text-lg font-bold text-white"
        >
          متوجه شدم
        </button>
      </div>
    </ModalOverlay>
  );
}
