export type MealPlanType = "workout" | "rest";

export interface FoodItem {
  id: string;
  name: string;
  amount: string;
}

export interface MealSection {
  id: string;
  title: string;
  icon: string;
  foods: FoodItem[];
  calories?: number;
  protein?: number;
  notes?: string[];
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