import { resetPrograms } from "../../utils/programEngine";
import { resetSession } from "../../utils/sessionEngine";
import { resetLibraryOverrides } from "../../store/workoutLibraryStore";
import { resetWarmupLibraryOverrides } from "../../store/warmupLibraryStore";
import { getCurrentUsername, resetCurrentUser } from "../../utils/userEngine";
import { resetFreeMeal } from "../../utils/freeMealEngine";
import { resetWeightLog } from "../../utils/weightEngine";
import { signOutRemote } from "../../auth/authEngine";
import { flushPendingSync, resetSyncMarkers } from "../../sync/remoteSync";

// Async so every caller awaits this before navigating away — a caller that
// does a full window.location reload right after would otherwise tear down
// the JS context before the server-side data is cleared, leaving the old
// snapshot to reappear if this account ever logs back in.
export async function resetApplication() {
  const username = getCurrentUsername();

  resetSession();
  resetPrograms();
  resetLibraryOverrides();
  resetWarmupLibraryOverrides();
  resetFreeMeal();
  resetWeightLog();

  if (username) {
    await flushPendingSync(username);
    resetSyncMarkers(username);
  }

  await signOutRemote();
  resetCurrentUser();
}