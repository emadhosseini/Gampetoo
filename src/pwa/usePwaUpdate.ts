import { useEffect, useState } from "react";

import { updateManager, type UpdateState } from "./updateManager";

/** Thin React adapter over the framework-agnostic updateManager — no update
 * logic lives here, only subscription bookkeeping. */
export function usePwaUpdate() {
  const [state, setState] = useState<UpdateState>(() =>
    updateManager.getState()
  );

  useEffect(() => {
    updateManager.init();

    return updateManager.subscribe(setState);
  }, []);

  return {
    ...state,
    applyUpdate: updateManager.applyUpdate,
    dismissUpdate: updateManager.dismissUpdate,
  };
}
