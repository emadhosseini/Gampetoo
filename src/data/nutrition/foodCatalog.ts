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

// The single pseudo meal-slot logged entries use in "daily" calorie-tracking
// mode (one unified list instead of per-meal cards) — flows through
// dailyLogEngine.ts unchanged, since its functions are already generic over
// slot id. "daily-total" doesn't collide with any real meal id above.
export const DAILY_MODE_SLOT: MealSlot = {
  id: "daily-total",
  title: "کالری روزانه",
  icon: "🍽️",
};

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
