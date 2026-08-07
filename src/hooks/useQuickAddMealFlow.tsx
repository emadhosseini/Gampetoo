import { useState } from "react";
import { useNavigate } from "react-router-dom";

import MealPickerModal from "@/components/nutrition/MealPickerModal";
import MealOverviewModal from "@/components/nutrition/MealOverviewModal";
import AddMealEntryModal from "@/components/nutrition/AddMealEntryModal";
import AiMealEntryModal from "@/components/nutrition/AiMealEntryModal";
import { getCalorieTrackingMode } from "@/utils/calorieModeEngine";
import {
  DAILY_MODE_SLOT,
  getMealSlots,
  type MealSlot,
} from "@/data/nutrition/foodCatalog";

type FoodStep =
  | { step: "pickMeal" }
  | { step: "overview"; meal: MealSlot }
  | { step: "add"; meal: MealSlot }
  | { step: "ai"; meal: MealSlot }
  | null;

/**
 * The bottom-nav quick-add drawer's "افزودن غذا" flow, factored out so any
 * other "+" that means the same thing can trigger the exact same behavior
 * instead of a copy of it — two copies drift the moment one of them gets a
 * fix the other doesn't. Mode-aware from the start: per-meal tracking asks
 * which meal first, daily tracking has only the one slot and skips straight
 * to it, and with no tracking mode chosen yet neither question has an
 * answer, so this falls back to the full page, which prompts for a mode
 * before anything else.
 *
 * `onChange` fires after an add/edit — pass a version bump if the caller
 * has its own numbers on screen to refresh (BottomNavigation has none of
 * its own, so it leaves this out).
 */
export function useQuickAddMealFlow(onChange: () => void = () => {}) {
  const navigate = useNavigate();
  const [foodStep, setFoodStep] = useState<FoodStep>(null);

  function openFoodFlow() {
    const mode = getCalorieTrackingMode();

    if (mode === null) {
      navigate("/daily-log");
      return;
    }

    setFoodStep(
      mode === "daily"
        ? { step: "overview", meal: DAILY_MODE_SLOT }
        : { step: "pickMeal" },
    );
  }

  const foodFlowModals = (
    <>
      <MealPickerModal
        open={foodStep?.step === "pickMeal"}
        options={getMealSlots()}
        onClose={() => setFoodStep(null)}
        onPick={(meal) => setFoodStep({ step: "overview", meal })}
      />

      <MealOverviewModal
        meal={foodStep?.step === "overview" ? foodStep.meal : null}
        onClose={() => setFoodStep(null)}
        onAdd={() =>
          setFoodStep(
            foodStep?.step === "overview"
              ? { step: "add", meal: foodStep.meal }
              : foodStep,
          )
        }
        onAddAi={() =>
          setFoodStep(
            foodStep?.step === "overview"
              ? { step: "ai", meal: foodStep.meal }
              : foodStep,
          )
        }
        onChange={onChange}
      />

      <AddMealEntryModal
        meal={foodStep?.step === "add" ? foodStep.meal : null}
        onClose={() => setFoodStep(null)}
        onChange={onChange}
      />

      <AiMealEntryModal
        meal={foodStep?.step === "ai" ? foodStep.meal : null}
        onClose={() => setFoodStep(null)}
        onChange={onChange}
      />
    </>
  );

  return { openFoodFlow, foodFlowModals };
}
