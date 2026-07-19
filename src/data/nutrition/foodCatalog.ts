import { mealPlans } from "./mealPlans";

import type { MealPlan, MealPlanType } from "../../types/nutrition";

export interface MealSlot {
  id: string;
  title: string;
  icon: string;
}

export interface FoodCatalogEntry {
  name: string;
  unit: string;
  defaultQuantity: number | null;
  defaultAmount: string;
  calories?: number;
}

const QUANTITY_PATTERN = /^(\d+(?:\.\d+)?)\s+(.+)$/;

function buildFoodCatalog(): FoodCatalogEntry[] {
  const catalog = new Map<string, FoodCatalogEntry>();

  for (const plan of Object.values(mealPlans)) {
    for (const meal of plan.meals) {
      for (const food of meal.foods) {
        if (catalog.has(food.name)) continue;

        const match = food.amount.match(QUANTITY_PATTERN);

        catalog.set(food.name, {
          name: food.name,
          unit: match ? match[2] : food.amount,
          defaultQuantity: match ? Number(match[1]) : null,
          defaultAmount: food.amount,
          calories: food.calories,
        });
      }
    }
  }

  return Array.from(catalog.values());
}

export const foodCatalog: FoodCatalogEntry[] = buildFoodCatalog();

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
