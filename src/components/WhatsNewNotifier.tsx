import WhatsNewModal from "./WhatsNewModal";
import { useWhatsNew } from "@/pwa/useWhatsNew";

// Wires whatsNewManager/useWhatsNew to the presentational WhatsNewModal — no
// logic of its own beyond that connection.
export default function WhatsNewNotifier() {
  const { open, version, highlights, dismiss } = useWhatsNew();

  return (
    <WhatsNewModal
      open={open}
      version={version}
      highlights={highlights}
      onClose={dismiss}
    />
  );
}
