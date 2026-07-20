import { resetPrograms } from "../../utils/programEngine";
import { resetSession } from "../../utils/sessionEngine";
import { resetLibraryOverrides } from "../../store/workoutLibraryStore";
import { resetWarmupLibraryOverrides } from "../../store/warmupLibraryStore";
import { getCurrentUsername, resetCurrentUser } from "../../utils/userEngine";
import { resetFreeMeal } from "../../utils/freeMealEngine";
import { signOutRemote } from "../../auth/authEngine";
import { resetSyncMarkers } from "../../sync/remoteSync";

export function resetApplication() {
  const username = getCurrentUsername();

  if (username) {
    resetSyncMarkers(username);
  }

  void signOutRemote();

  resetSession();
  resetPrograms();
  resetLibraryOverrides();
  resetWarmupLibraryOverrides();
  resetCurrentUser();
  resetFreeMeal();
}