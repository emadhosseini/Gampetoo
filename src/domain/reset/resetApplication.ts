import { resetPrograms } from "../../utils/programEngine";
import { resetSession } from "../../utils/sessionEngine";
import { resetWorkoutCompletionLog } from "../../utils/workoutCompletionLog";
import {
  resetDefaultPlanNames,
  resetLibraryOverrides,
  resetWorkoutExtras,
} from "../../store/workoutLibraryStore";
import { resetExerciseOrder } from "../../store/workoutOrderStore";
import { resetExerciseNotes } from "../../store/exerciseNoteStore";
import { resetWorkoutVariants } from "../../store/workoutVariantStore";
import { resetExerciseSetLog } from "../../utils/exerciseSetLogEngine";
import { resetCalendarPreference } from "../../utils/calendarPreferenceEngine";
import { resetAppSettings } from "../../utils/appSettingsEngine";
import { resetWarmupLibraryOverrides } from "../../store/warmupLibraryStore";
import { resetLearnedFoods } from "../../store/learnedFoodsStore";
import {
  getCurrentUsername,
  resetCurrentUser,
  resetUserProfile,
} from "../../utils/userEngine";
import { resetFreeMeal } from "../../utils/freeMealEngine";
import { resetWeightLog } from "../../utils/weightEngine";
import { resetDailyLog, resetDeletedEntryIds } from "../../utils/dailyLogEngine";
import { resetCalorieTrackingMode } from "../../utils/calorieModeEngine";
import { resetCalorieProfile } from "../../utils/calorieEngine";
import { resetWaterLog } from "../../utils/waterEngine";
import { resetActivityLog } from "../../utils/activityLogEngine";
import { resetWorkoutCalorieLog } from "../../utils/workoutCalorieEngine";
import { resetLastSeenVersion } from "../../pwa/whatsNewManager";
import { deleteAccountRemote, signOutRemote } from "../../auth/authEngine";
import { clearSyncedKeys, flushPendingSync, resetSyncMarkers } from "../../sync/remoteSync";

export interface DeleteAccountResult {
  ok: boolean;
  error?: string;
}

/**
 * Every engine's own reset, plus the profile fields. Deliberately runs while
 * the username is still set — each reset resolves its scoped key through it.
 */
function wipeLocalData(username: string | null) {
  resetSession();
  resetWorkoutCompletionLog();
  resetPrograms();
  resetLibraryOverrides();
  resetDefaultPlanNames();
  resetWorkoutExtras();
  resetExerciseOrder();
  resetExerciseNotes();
  resetWorkoutVariants();
  resetExerciseSetLog();
  resetCalendarPreference();
  resetAppSettings();
  resetWarmupLibraryOverrides();
  resetFreeMeal();
  resetWeightLog();
  resetDailyLog();
  resetDeletedEntryIds();
  resetCalorieTrackingMode();
  resetCalorieProfile();
  resetWaterLog();
  resetActivityLog();
  resetWorkoutCalorieLog();
  resetLearnedFoods();
  resetLastSeenVersion();
  // Before the push below, not after: name/gender/height/age are synced, so
  // clearing them only once the snapshot had already gone up left the server
  // holding a copy to hand back at the next login.
  resetUserProfile();

  // Backstop for anything the calls above missed — see clearSyncedKeys.
  if (username) clearSyncedKeys(username);
}

/**
 * Factory reset: wipes this account's data everywhere but keeps the account
 * itself, so the same username and PIN still work. Used by the error screen's
 * recovery button.
 *
 * Async so every caller awaits it before navigating away — a caller that does
 * a full window.location reload right after would otherwise tear down the JS
 * context before the emptied snapshot reaches the server, leaving the old one
 * to reappear at the next login.
 */
export async function resetApplication() {
  const username = getCurrentUsername();

  wipeLocalData(username);

  if (username) {
    await flushPendingSync(username);
    resetSyncMarkers(username);
  }

  await signOutRemote();
  resetCurrentUser();
}

/**
 * Deletes the account outright — the server-side data, the auth user, and
 * everything stored on this device. Unlike resetApplication() the username
 * is released afterwards, so it can be registered fresh.
 *
 * The remote delete goes first, while the session is still valid, and nothing
 * local is touched until it succeeds: a failure here has to leave the account
 * exactly as it was rather than a half-deleted one whose data is gone locally
 * but intact on the server. Nothing is pushed afterwards either — the row is
 * gone, and an upsert would only recreate it.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  const username = getCurrentUsername();
  const remote = await deleteAccountRemote();

  if (!remote.ok) {
    return remote;
  }

  wipeLocalData(username);

  if (username) {
    resetSyncMarkers(username);
  }

  await signOutRemote();
  resetCurrentUser();

  return { ok: true };
}
