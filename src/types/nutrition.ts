export type MealPlanType = "workout" | "rest";

export interface FoodItem {
  id: string;
  name: string;
  amount: string;
  calories?: number;
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