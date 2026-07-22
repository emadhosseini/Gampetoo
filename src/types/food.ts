export type FoodCategory =
  | "main_dish"
  | "bread_grain"
  | "dairy"
  | "protein"
  | "snack";

export interface FoodItem {
  id: string;
  nameFa: string;
  nameEn: string;
  category: FoodCategory;
  servingUnit: string;
  servingWeightGrams: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
}
