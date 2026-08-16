export type MealPlanType = "workout" | "rest";

export interface FoodItem {
  id: string;
  name: string;
  amount: string;
  calories?: number;
  // The rest of the macros for this exact amount, recorded the same moment
  // the calories are (NutritionPlanDetailPage). They used to be dropped,
  // which meant logging a planned food as eaten could only ever contribute
  // calories — every macro chart stayed flat no matter what you ate. Still
  // optional: a plan saved before this existed has none, and the log flow
  // falls back to the food catalog for those (see planFoodLogging).
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface MealSection {
  id: string;
  title: string;
  icon: string;
  foods: FoodItem[];
  calories?: number;
  protein?: number;
  notes?: string[];
  enabled?: boolean;
}

export interface FoodSubstitution {
  title: string;
  foods: string[];
}

export interface MealPlan {
  type: MealPlanType;
  title: string;
  meals: MealSection[];
  substitutions: FoodSubstitution[];
  freeMeal: string;
}