import type { FoodItem } from "@/types/food";

// The staples of a typical workout/bodybuilding meal plan — high-protein,
// low-fat foods people specifically search for while building a training
// day's diet (plain chicken breast, tuna, cottage cheese, ...), as opposed
// to iranianFoodsDatabase/internationalFoodsDatabase's general-purpose
// dishes. Figures are typical/average estimates (see those files), sourced
// against commonly-cited USDA-based values for the cooked/prepared form.
export const gymFoodsDatabase: FoodItem[] = [
  // protein
  {
    id: "chicken-breast-boiled",
    nameFa: "سینه مرغ آب‌پز",
    nameEn: "Boiled Chicken Breast",
    category: "protein",
    servingUnits: [
      { label: "تکه", grams: 100 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    fiberPer100g: 0,
  },
  {
    id: "chicken-breast-grilled",
    nameFa: "سینه مرغ کبابی",
    nameEn: "Grilled Chicken Breast",
    category: "protein",
    servingUnits: [
      { label: "تکه", grams: 100 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    fiberPer100g: 0,
  },
  {
    id: "turkey-breast",
    nameFa: "سینه بوقلمون",
    nameEn: "Turkey Breast (grilled)",
    category: "protein",
    servingUnits: [
      { label: "تکه", grams: 100 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 135,
    proteinPer100g: 30,
    carbsPer100g: 0,
    fatPer100g: 1,
    fiberPer100g: 0,
  },
  {
    id: "tuna-canned",
    nameFa: "تن ماهی (آب‌پز، آبکش شده)",
    nameEn: "Canned Tuna (in water, drained)",
    category: "protein",
    servingUnits: [
      { label: "قوطی", grams: 90 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 132,
    proteinPer100g: 28.2,
    carbsPer100g: 0,
    fatPer100g: 1.3,
    fiberPer100g: 0,
  },
  {
    id: "egg-white-raw",
    nameFa: "سفیده تخم مرغ",
    nameEn: "Egg White",
    category: "protein",
    servingUnits: [
      { label: "عدد", grams: 33 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 52,
    proteinPer100g: 11,
    carbsPer100g: 0.7,
    fatPer100g: 0.2,
    fiberPer100g: 0,
  },
  {
    id: "lean-ground-beef",
    nameFa: "گوشت چرخ‌کرده کم‌چرب",
    nameEn: "Lean Ground Beef (95%, cooked)",
    category: "protein",
    servingUnits: [
      { label: "پرس", grams: 150 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 172,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 7,
    fiberPer100g: 0,
  },
  {
    id: "whey-protein",
    nameFa: "پودر پروتئین وی",
    nameEn: "Whey Protein Powder",
    category: "protein",
    servingUnits: [
      { label: "اسکوپ", grams: 30 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 380,
    proteinPer100g: 78,
    carbsPer100g: 8,
    fatPer100g: 5,
    fiberPer100g: 0,
  },

  // dairy
  {
    id: "cottage-cheese-lowfat",
    nameFa: "پنیر کاتیج کم‌چرب",
    nameEn: "Low-Fat Cottage Cheese",
    category: "dairy",
    servingUnits: [
      { label: "پیمانه", grams: 110 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 72,
    proteinPer100g: 12,
    carbsPer100g: 2.7,
    fatPer100g: 1,
    fiberPer100g: 0,
  },

  // bread_grain
  {
    id: "brown-rice-cooked",
    nameFa: "برنج قهوه‌ای پخته",
    nameEn: "Cooked Brown Rice",
    category: "bread_grain",
    servingUnits: [
      { label: "پیمانه", grams: 150 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 123,
    proteinPer100g: 2.7,
    carbsPer100g: 26,
    fatPer100g: 1,
    fiberPer100g: 1.6,
  },
  {
    id: "sweet-potato-baked",
    nameFa: "سیب زمینی شیرین پخته",
    nameEn: "Baked Sweet Potato",
    category: "bread_grain",
    servingUnits: [
      { label: "عدد", grams: 130 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 90,
    proteinPer100g: 2,
    carbsPer100g: 21,
    fatPer100g: 0.1,
    fiberPer100g: 3.3,
  },
  {
    id: "quinoa-cooked",
    nameFa: "کینوا پخته",
    nameEn: "Cooked Quinoa",
    category: "bread_grain",
    servingUnits: [
      { label: "پیمانه", grams: 150 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 120,
    proteinPer100g: 4.4,
    carbsPer100g: 21,
    fatPer100g: 1.9,
    fiberPer100g: 2.8,
  },

  // snack
  {
    id: "rice-cakes",
    nameFa: "بیسکویت برنجی",
    nameEn: "Rice Cakes",
    category: "snack",
    servingUnits: [
      { label: "عدد", grams: 9 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 387,
    proteinPer100g: 8,
    carbsPer100g: 82,
    fatPer100g: 2.8,
    fiberPer100g: 3.5,
  },
];
