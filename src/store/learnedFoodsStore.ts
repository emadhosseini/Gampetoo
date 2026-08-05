import type { FoodItem } from "@/types/food";
import { scopedKey } from "@/utils/userEngine";

// Foods discovered via an external lookup (Open Food Facts, currently only
// reached from the AI meal-parsing flow — see aiFoodMatching.ts) get saved
// here so the next search for the same food — AI or manual — hits the local
// database instead of round-tripping the network again.
const STORAGE_KEY = "emad-learned-foods";

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

export function getLearnedFoods(): FoodItem[] {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return [];

  try {
    return JSON.parse(saved) as FoodItem[];
  } catch {
    return [];
  }
}

export function addLearnedFood(food: FoodItem) {
  const foods = getLearnedFoods();

  if (foods.some((f) => f.id === food.id)) return;

  foods.push(food);
  localStorage.setItem(storageKey(), JSON.stringify(foods));
}

export function resetLearnedFoods() {
  localStorage.removeItem(storageKey());
}
