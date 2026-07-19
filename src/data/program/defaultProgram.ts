import type { Program } from "../../types/program";
import { createEmptyMealPlan } from "../nutrition/foodCatalog";
import { generateId } from "../../utils/id";

export const defaultProgram: Program = {
  id: generateId(),

  name: "برنامه اصلی",

  startDate: "",

  active: true,

  workout: {
    days: [],
  },

  nutrition: {
    workout: createEmptyMealPlan("workout"),
    rest: createEmptyMealPlan("rest"),
  },

  settings: {
    autoRepeat: true,
  },
};
