import { resetPrograms } from "../../utils/programEngine";
import { resetSession } from "../../utils/sessionEngine";
import { resetLibraryOverrides } from "../../store/workoutLibraryStore";
import { resetCurrentUser } from "../../utils/userEngine";
import { resetFreeMeal } from "../../utils/freeMealEngine";

export function resetApplication() {
  resetSession();
  resetPrograms();
  resetLibraryOverrides();
  resetCurrentUser();
  resetFreeMeal();
}