import type { MealPlan } from "../../types/nutrition";

export const mealPlans: Record<"workout" | "rest", MealPlan> = {
  workout: {
    type: "workout",
    title: "تغذیه روز تمرین",

    meals: [
      {
        id: "wake-up",
        title: "بعد از بیدار شدن",
        icon: "💧",
        foods: [
          {
            id: "water",
            name: "آب",
            amount: "700 ml",
          },
          {
            id: "coffee",
            name: "قهوه تلخ",
            amount: "1 فنجان",
          },
        ],
      },

      {
        id: "breakfast",
        title: "صبحانه",
        icon: "🌅",
        foods: [
          {
            id: "egg",
            name: "تخم مرغ کامل",
            amount: "2 عدد",
          },
          {
            id: "egg-white",
            name: "سفیده تخم مرغ",
            amount: "4 عدد",
          },
          {
            id: "oats",
            name: "جو دوسر",
            amount: "60 g",
          },
          {
            id: "banana",
            name: "موز",
            amount: "1 عدد",
          },
        ],
        calories: 540,
        protein: 40,
      },

      {
        id: "pre-workout",
        title: "قبل تمرین",
        icon: "☕",
        foods: [
          {
            id: "espresso",
            name: "اسپرسو",
            amount: "1 شات",
          },
        ],
        notes: [
          "۵ گرم کراتین در هر زمان از روز قابل مصرف است.",
        ],
      },

      {
        id: "post-workout",
        title: "بعد تمرین",
        icon: "🏋️",
        foods: [
          {
            id: "chicken",
            name: "سینه مرغ",
            amount: "200 g",
          },
          {
            id: "rice",
            name: "برنج پخته",
            amount: "200 g",
          },
          {
            id: "salad",
            name: "سالاد",
            amount: "به مقدار دلخواه",
          },
        ],
        calories: 620,
        protein: 65,
      },

      {
        id: "lunch",
        title: "ناهار",
        icon: "🍽",
        foods: [
          {
            id: "beef",
            name: "گوشت کم چرب",
            amount: "200 g",
          },
          {
            id: "potato",
            name: "سیب زمینی",
            amount: "250 g",
          },
          {
            id: "vegetables",
            name: "سبزیجات",
            amount: "به مقدار دلخواه",
          },
        ],
      },

      {
        id: "snack",
        title: "میان وعده",
        icon: "🥜",
        foods: [
          {
            id: "greek-yogurt",
            name: "ماست یونانی",
            amount: "250 g",
          },
          {
            id: "almond",
            name: "بادام",
            amount: "30 g",
          },
        ],
      },

      {
        id: "dinner",
        title: "شام",
        icon: "🌙",
        foods: [
          {
            id: "fish",
            name: "ماهی",
            amount: "200 g",
          },
          {
            id: "vegetables-dinner",
            name: "سبزیجات",
            amount: "به مقدار دلخواه",
          },
          {
            id: "rice-dinner",
            name: "برنج پخته",
            amount: "100 g",
          },
        ],
      },

      {
        id: "before-bed",
        title: "قبل خواب",
        icon: "🥛",
        foods: [
          {
            id: "night-yogurt",
            name: "ماست یونانی یا پنیر کاتیج کم چرب",
            amount: "200 g",
          },
        ],
      },
    ],

    substitutions: [
      {
        title: "جایگزین مرغ",
        foods: [
          "بوقلمون",
          "گوشت کم چرب",
          "ماهی",
        ],
      },
      {
        title: "جایگزین برنج",
        foods: [
          "سیب زمینی",
          "سیب زمینی شیرین",
          "جو دوسر",
        ],
      },
      {
        title: "جایگزین ماست یونانی",
        foods: [
          "پنیر کاتیج کم چرب",
          "ماست پرپروتئین",
        ],
      },
    ],

    freeMeal: "هر هفته فقط یک وعده آزاد داری.",
  },

  rest: {
    type: "rest",
    title: "تغذیه روز استراحت",

    meals: [
      {
        id: "breakfast",
        title: "صبحانه",
        icon: "🌅",
        foods: [
          {
            id: "egg",
            name: "تخم مرغ کامل",
            amount: "2 عدد",
          },
          {
            id: "egg-white",
            name: "سفیده تخم مرغ",
            amount: "4 عدد",
          },
          {
            id: "oats",
            name: "جو دوسر",
            amount: "60 g",
          },
          {
            id: "banana",
            name: "موز",
            amount: "1 عدد",
          },
        ],
      },

      {
        id: "lunch",
        title: "ناهار",
        icon: "🍽",
        foods: [
          {
            id: "chicken",
            name: "مرغ",
            amount: "200 g",
          },
          {
            id: "rice",
            name: "برنج پخته",
            amount: "150 g",
          },
        ],
      },

      {
        id: "dinner",
        title: "شام",
        icon: "🌙",
        foods: [
          {
            id: "fish",
            name: "ماهی",
            amount: "200 g",
          },
          {
            id: "vegetables",
            name: "سبزیجات",
            amount: "به مقدار دلخواه",
          },
        ],
      },
    ],

    substitutions: [
      {
        title: "جایگزین مرغ",
        foods: [
          "بوقلمون",
          "گوشت کم چرب",
          "ماهی",
        ],
      },
      {
        title: "جایگزین برنج",
        foods: [
          "سیب زمینی",
          "سیب زمینی شیرین",
          "جو دوسر",
        ],
      },
      {
        title: "جایگزین ماست یونانی",
        foods: [
          "پنیر کاتیج کم چرب",
          "ماست پرپروتئین",
        ],
      },
    ],

    freeMeal: "هر هفته فقط یک وعده آزاد داری.",
  },
};