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
            amount: "700 میلی‌لیتر",
            calories: 0,
          },
          {
            id: "coffee",
            name: "قهوه تلخ",
            amount: "1 فنجان",
            calories: 2,
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
            calories: 140,
          },
          {
            id: "egg-white",
            name: "سفیده تخم مرغ",
            amount: "4 عدد",
            calories: 68,
          },
          {
            id: "oats",
            name: "جو دوسر",
            amount: "60 گرم",
            calories: 230,
          },
          {
            id: "banana",
            name: "موز",
            amount: "1 عدد",
            calories: 105,
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
            amount: "1 فنجان",
            calories: 2,
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
            amount: "200 گرم",
            calories: 330,
          },
          {
            id: "rice",
            name: "برنج پخته",
            amount: "200 گرم",
            calories: 260,
          },
          {
            id: "salad",
            name: "سالاد",
            amount: "به مقدار دلخواه",
            calories: 30,
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
            amount: "200 گرم",
            calories: 380,
          },
          {
            id: "potato",
            name: "سیب زمینی",
            amount: "250 گرم",
            calories: 215,
          },
          {
            id: "vegetables",
            name: "سبزیجات",
            amount: "به مقدار دلخواه",
            calories: 50,
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
            amount: "250 گرم",
            calories: 145,
          },
          {
            id: "almond",
            name: "بادام",
            amount: "30 گرم",
            calories: 174,
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
            amount: "200 گرم",
            calories: 240,
          },
          {
            id: "vegetables-dinner",
            name: "سبزیجات",
            amount: "به مقدار دلخواه",
            calories: 50,
          },
          {
            id: "rice-dinner",
            name: "برنج پخته",
            amount: "100 گرم",
            calories: 130,
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
            amount: "200 گرم",
            calories: 120,
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
            calories: 140,
          },
          {
            id: "egg-white",
            name: "سفیده تخم مرغ",
            amount: "4 عدد",
            calories: 68,
          },
          {
            id: "oats",
            name: "جو دوسر",
            amount: "60 گرم",
            calories: 230,
          },
          {
            id: "banana",
            name: "موز",
            amount: "1 عدد",
            calories: 105,
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
            amount: "200 گرم",
            calories: 330,
          },
          {
            id: "rice",
            name: "برنج پخته",
            amount: "150 گرم",
            calories: 195,
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
            amount: "200 گرم",
            calories: 240,
          },
          {
            id: "vegetables",
            name: "سبزیجات",
            amount: "به مقدار دلخواه",
            calories: 50,
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
