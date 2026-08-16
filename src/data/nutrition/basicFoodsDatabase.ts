import type { FoodItem } from "@/types/food";

// The plain staples — an egg, chicken breast, cooked rice, "vegetables" —
// as opposed to the named dishes and specific preparations the other three
// databases hold ("سینه مرغ سوخاری", "سیب زمینی تنوری", "قرمه سبزی").
//
// They exist because the built-in meal plans are written in exactly these
// generic terms, and a plan food with no catalog entry behind it can only
// ever contribute calories to the daily log — no protein, no carbs, no fat,
// no macro charts. Ids match the ids those plans use, so they resolve by id
// rather than by a name comparison that any wording change would break.
//
// Macros are per 100g (see FoodItem) and are typical cooked-weight figures,
// chosen to agree with the calorie numbers the default plans already
// printed for their stated portions.
export const basicFoodsDatabase: FoodItem[] = [
  // protein
  {
    id: "egg",
    nameFa: "تخم مرغ کامل",
    nameEn: "Whole Egg",
    aliases: ["تخم مرغ"],
    category: "protein",
    servingUnits: [
      { label: "عدد", grams: 50 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 143,
    proteinPer100g: 12.6,
    carbsPer100g: 0.7,
    fatPer100g: 9.5,
    fiberPer100g: 0,
  },
  {
    id: "chicken",
    nameFa: "سینه مرغ",
    nameEn: "Chicken Breast (plain, cooked)",
    aliases: ["مرغ", "سینه مرغ ساده"],
    category: "protein",
    servingUnits: [
      { label: "گرم", grams: 1 },
      { label: "فیله", grams: 120 },
      { label: "پرس", grams: 150 },
    ],
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    fiberPer100g: 0,
  },
  {
    id: "beef",
    nameFa: "گوشت کم چرب",
    nameEn: "Lean Beef (cooked)",
    aliases: ["گوشت قرمز کم چرب", "گوشت"],
    category: "protein",
    servingUnits: [
      { label: "گرم", grams: 1 },
      { label: "پرس", grams: 150 },
    ],
    caloriesPer100g: 190,
    proteinPer100g: 30,
    carbsPer100g: 0,
    fatPer100g: 7.5,
    fiberPer100g: 0,
  },
  {
    id: "fish",
    nameFa: "ماهی سفید",
    nameEn: "White Fish (cooked)",
    aliases: ["ماهی"],
    category: "protein",
    servingUnits: [
      { label: "گرم", grams: 1 },
      { label: "پرس", grams: 150 },
    ],
    caloriesPer100g: 120,
    proteinPer100g: 21,
    carbsPer100g: 0,
    fatPer100g: 4,
    fiberPer100g: 0,
  },

  // bread_grain
  {
    id: "oats",
    nameFa: "جو دوسر",
    nameEn: "Oats (dry)",
    aliases: ["جو پرک", "اوتس"],
    category: "bread_grain",
    servingUnits: [
      { label: "گرم", grams: 1 },
      { label: "پیمانه", grams: 90 },
      { label: "قاشق غذاخوری", grams: 10 },
    ],
    caloriesPer100g: 380,
    proteinPer100g: 13,
    carbsPer100g: 67,
    fatPer100g: 7,
    fiberPer100g: 10,
  },

  // snack — the "whatever vegetables you like" side the plans prescribe
  // without naming one, kept honest as a mixed average rather than pinned
  // to a single vegetable.
  {
    id: "vegetables",
    nameFa: "سبزیجات پخته",
    nameEn: "Mixed Cooked Vegetables",
    aliases: ["سبزیجات"],
    category: "snack",
    servingUnits: [
      { label: "پیمانه", grams: 150 },
      { label: "پرس", grams: 200 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 45,
    proteinPer100g: 2.5,
    carbsPer100g: 9,
    fatPer100g: 0.3,
    fiberPer100g: 3,
  },
  {
    id: "salad",
    nameFa: "سالاد",
    nameEn: "Green Salad (no dressing)",
    aliases: ["سالاد ساده", "سالاد سبز"],
    category: "snack",
    servingUnits: [
      { label: "پرس", grams: 150 },
      { label: "کاسه", grams: 200 },
      { label: "گرم", grams: 1 },
    ],
    caloriesPer100g: 20,
    proteinPer100g: 1.2,
    carbsPer100g: 4,
    fatPer100g: 0.2,
    fiberPer100g: 1.6,
  },
];
