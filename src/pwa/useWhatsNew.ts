import { useEffect, useState } from "react";

import { whatsNewManager, type WhatsNewState } from "./whatsNewManager";

/** Thin React adapter over the framework-agnostic whatsNewManager. */
export function useWhatsNew() {
  const [state, setState] = useState<WhatsNewState>(() =>
    whatsNewManager.getState()
  );

  useEffect(() => {
    whatsNewManager.init();

    return whatsNewManager.subscribe(setState);
  }, []);

  return {
    ...state,
    version: whatsNewManager.version,
    highlights: whatsNewManager.highlights,
    dismiss: whatsNewManager.dismiss,
  };
}
