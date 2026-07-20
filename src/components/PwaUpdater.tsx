import UpdateModal from "./UpdateModal";
import { usePwaUpdate } from "@/pwa/usePwaUpdate";

// Wires the update logic (usePwaUpdate/updateManager) to the presentational
// UpdateModal — this file has no logic of its own beyond that connection.
export default function PwaUpdater() {
  const { status, currentVersion, newVersion, applyUpdate, dismissUpdate } =
    usePwaUpdate();

  return (
    <UpdateModal
      open={status === "available" || status === "updating"}
      currentVersion={currentVersion}
      newVersion={newVersion}
      updating={status === "updating"}
      onLater={dismissUpdate}
      onUpdate={applyUpdate}
    />
  );
}
