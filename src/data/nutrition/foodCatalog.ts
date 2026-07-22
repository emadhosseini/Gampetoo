import { mealPlans } from "./mealPlans";

import type { MealPlan, MealPlanType } from "../../types/nutrition";

export interface MealSlot {
  id: string;
  title: string;
  icon: string;
}

function buildMealSlots(): MealSlot[] {
  const slots = new Map<string, MealSlot>();

  for (const plan of Object.values(mealPlans)) {
    for (const meal of plan.meals) {
      if (!slots.has(meal.id)) {
        slots.set(meal.id, {
          id: meal.id,
          title: meal.title,
          icon: meal.icon,
        });
      }
    }
  }

  return Array.from(slots.values());
}

export const mealSlots: MealSlot[] = buildMealSlots();

export function getMealSlots(): MealSlot[] {
  return mealSlots;
}

export function createEmptyMealPlan(type: MealPlanType): MealPlan {
  const plan = mealPlans[type];

  return {
    type: plan.type,
    title: plan.title,
    meals: getMealSlots().map((slot) => ({
      id: slot.id,
      title: slot.title,
      icon: slot.icon,
      foods: [],
      enabled: false,
    })),
    substitutions: plan.substitutions,
    freeMeal: plan.freeMeal,
  };
}
