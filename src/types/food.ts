export type FoodCategory =
  | "main_dish"
  | "bread_grain"
  | "dairy"
  | "protein"
  | "snack"
  | "supplement";

// One selectable way to count out a serving of a food (a spoonful, a whole
// piece, a cup, plain grams, ...) — `grams` is how much one of that unit
// weighs, so any (unit, quantity) pair converts to a gram amount the same
// way regardless of which unit was picked.
export interface ServingUnit {
  label: string;
  grams: number;
}

export interface FoodItem {
  id: string;
  nameFa: string;
  nameEn: string;
  category: FoodCategory;
  // 1-3 reasonable ways to count this food out (e.g. a kebab by "سیخ", rice
  // by "پیمانه", nuts by "قاشق غذاخوری") — always includes a plain-gram
  // option. The first entry is the default when a food is first selected.
  servingUnits: ServingUnit[];
  // Macros are per 100g so they scale correctly no matter which servingUnit
  // (and quantity) the user actually picks.
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
}
