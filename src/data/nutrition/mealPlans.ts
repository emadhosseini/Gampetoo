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
            amount: "3 لیوان",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          },
          {
            id: "coffee",
            name: "قهوه تلخ",
            amount: "1 فنجان",
            calories: 2,
            protein: 0,
            carbs: 0,
            fat: 0,
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
            protein: 12,
            carbs: 1,
            fat: 10,
          },
          {
            id: "egg-white",
            name: "سفیده تخم مرغ",
            amount: "4 عدد",
            calories: 68,
            protein: 14,
            carbs: 1,
            fat: 0,
          },
          {
            id: "oats",
            name: "جو دوسر",
            amount: "60 گرم",
            calories: 230,
            protein: 8,
            carbs: 40,
            fat: 4,
            fiber: 6,
          },
          {
            id: "banana",
            name: "موز",
            amount: "1 عدد",
            calories: 105,
            protein: 1,
            carbs: 27,
            fat: 0,
            fiber: 3,
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
            protein: 0,
            carbs: 0,
            fat: 0,
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
            protein: 62,
            carbs: 0,
            fat: 7,
          },
          {
            id: "rice",
            name: "برنج پخته",
            amount: "200 گرم",
            calories: 260,
            protein: 5,
            carbs: 56,
            fat: 1,
            fiber: 1,
          },
          {
            id: "salad",
            name: "سالاد",
            amount: "به مقدار دلخواه",
            calories: 30,
            protein: 1,
            carbs: 6,
            fat: 0,
            fiber: 2,
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
            protein: 60,
            carbs: 0,
            fat: 15,
          },
          {
            id: "potato",
            name: "سیب زمینی",
            amount: "250 گرم",
            calories: 215,
            protein: 5,
            carbs: 50,
            fat: 0,
            fiber: 5,
          },
          {
            id: "vegetables",
            name: "سبزیجات",
            amount: "به مقدار دلخواه",
            calories: 50,
            protein: 3,
            carbs: 10,
            fat: 0,
            fiber: 4,
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
            protein: 25,
            carbs: 9,
            fat: 0,
          },
          {
            id: "almond",
            name: "بادام",
            amount: "30 گرم",
            calories: 174,
            protein: 6,
            carbs: 6,
            fat: 15,
            fiber: 4,
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
            protein: 42,
            carbs: 0,
            fat: 8,
          },
          {
            id: "vegetables-dinner",
            name: "سبزیجات",
            amount: "به مقدار دلخواه",
            calories: 50,
            protein: 3,
            carbs: 10,
            fat: 0,
            fiber: 4,
          },
          {
            id: "rice-dinner",
            name: "برنج پخته",
            amount: "100 گرم",
            calories: 130,
            protein: 3,
            carbs: 28,
            fat: 0,
            fiber: 1,
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
            protein: 20,
            carbs: 7,
            fat: 1,
          },
        ],
      },

      {
        id: "supplements",
        title: "مکمل و ویتامین‌ها",
        icon: "💊",
        foods: [],
      },
    ],

    substitutions: [
      {
        title: "جایگزین مرغ",
        foods: [
          "بوقلمون",
          "گوشت کم چرب",
          "ماهی",
          "میگو",
          "تن ماهی در آب",
          "سویا",
          "سینه بوقلمون",
        ],
      },
      {
        title: "جایگزین گوشت قرمز",
        foods: [
          "سینه مرغ",
          "بوقلمون",
          "ماهی",
          "جگر",
          "عدسی پرپروتئین",
        ],
      },
      {
        title: "جایگزین ماهی",
        foods: [
          "میگو",
          "تن ماهی در آب",
          "سینه مرغ",
          "تخم مرغ",
        ],
      },
      {
        title: "جایگزین تخم مرغ",
        foods: [
          "سفیده تخم مرغ",
          "پنیر کاتیج کم چرب",
          "ماست یونانی",
          "توفو",
        ],
      },
      {
        title: "جایگزین برنج",
        foods: [
          "سیب زمینی",
          "سیب زمینی شیرین",
          "جو دوسر",
          "ماکارونی سبوس‌دار",
          "کینوا",
          "دمپخت بدون روغن",
          "نان سبوس‌دار",
        ],
      },
      {
        title: "جایگزین جو دوسر",
        foods: [
          "نان سبوس‌دار",
          "برنج",
          "سیب زمینی",
          "کینوا",
          "کورن فلکس بدون شکر",
        ],
      },
      {
        title: "جایگزین سیب زمینی",
        foods: [
          "سیب زمینی شیرین",
          "برنج",
          "ماکارونی",
          "نان سبوس‌دار",
          "کدو حلوایی",
        ],
      },
      {
        title: "جایگزین ماکارونی و پاستا",
        foods: [
          "برنج",
          "سیب زمینی",
          "ماکارونی سبوس‌دار",
          "کینوا",
        ],
      },
      {
        title: "جایگزین ماست یونانی",
        foods: [
          "پنیر کاتیج کم چرب",
          "ماست پرپروتئین",
          "ماست کم چرب",
          "دوغ بدون گاز",
        ],
      },
      {
        title: "جایگزین شیر",
        foods: [
          "ماست کم چرب",
          "دوغ",
          "شیر بادام",
          "شیر سویا",
        ],
      },
      {
        title: "جایگزین پنیر",
        foods: [
          "پنیر کاتیج کم چرب",
          "ماست یونانی",
          "پنیر لبنه کم چرب",
        ],
      },
      {
        title: "جایگزین موز",
        foods: [
          "سیب",
          "پرتقال",
          "خرما",
          "توت فرنگی",
          "انگور",
        ],
      },
      {
        title: "جایگزین میوه",
        foods: [
          "سیب",
          "پرتقال",
          "کیوی",
          "توت فرنگی",
          "هلو",
          "گلابی",
        ],
      },
      {
        title: "جایگزین بادام",
        foods: [
          "گردو",
          "پسته",
          "فندق",
          "بادام زمینی",
          "تخمه کدو",
          "کره بادام زمینی",
        ],
      },
      {
        title: "جایگزین سبزیجات",
        foods: [
          "کاهو",
          "خیار",
          "گوجه فرنگی",
          "کلم بروکلی",
          "اسفناج",
          "هویج",
          "لوبیا سبز",
        ],
      },
      {
        title: "جایگزین سالاد",
        foods: [
          "سبزیجات بخارپز",
          "سالاد شیرازی",
          "کلم بروکلی",
          "اسفناج تازه",
        ],
      },
      {
        title: "جایگزین قهوه",
        foods: [
          "اسپرسو",
          "آمریکانو",
          "قهوه ترک",
          "چای سبز",
          "نسکافه بدون شکر",
        ],
      },
      {
        title: "جایگزین روغن",
        foods: [
          "روغن زیتون",
          "روغن کنجد",
          "آووکادو",
          "کره بادام زمینی",
        ],
      },
      {
        title: "جایگزین شکر",
        foods: [
          "خرما",
          "عسل",
          "استویا",
          "شیره انگور",
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
            protein: 12,
            carbs: 1,
            fat: 10,
          },
          {
            id: "egg-white",
            name: "سفیده تخم مرغ",
            amount: "4 عدد",
            calories: 68,
            protein: 14,
            carbs: 1,
            fat: 0,
          },
          {
            id: "oats",
            name: "جو دوسر",
            amount: "60 گرم",
            calories: 230,
            protein: 8,
            carbs: 40,
            fat: 4,
            fiber: 6,
          },
          {
            id: "banana",
            name: "موز",
            amount: "1 عدد",
            calories: 105,
            protein: 1,
            carbs: 27,
            fat: 0,
            fiber: 3,
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
            protein: 62,
            carbs: 0,
            fat: 7,
          },
          {
            id: "rice",
            name: "برنج پخته",
            amount: "150 گرم",
            calories: 195,
            protein: 4,
            carbs: 42,
            fat: 1,
            fiber: 1,
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
            protein: 42,
            carbs: 0,
            fat: 8,
          },
          {
            id: "vegetables",
            name: "سبزیجات",
            amount: "به مقدار دلخواه",
            calories: 50,
            protein: 3,
            carbs: 10,
            fat: 0,
            fiber: 4,
          },
        ],
      },

      {
        id: "supplements",
        title: "مکمل و ویتامین‌ها",
        icon: "💊",
        foods: [],
      },
    ],

    substitutions: [
      {
        title: "جایگزین مرغ",
        foods: [
          "بوقلمون",
          "گوشت کم چرب",
          "ماهی",
          "میگو",
          "تن ماهی در آب",
          "سویا",
          "سینه بوقلمون",
        ],
      },
      {
        title: "جایگزین گوشت قرمز",
        foods: [
          "سینه مرغ",
          "بوقلمون",
          "ماهی",
          "جگر",
          "عدسی پرپروتئین",
        ],
      },
      {
        title: "جایگزین ماهی",
        foods: [
          "میگو",
          "تن ماهی در آب",
          "سینه مرغ",
          "تخم مرغ",
        ],
      },
      {
        title: "جایگزین تخم مرغ",
        foods: [
          "سفیده تخم مرغ",
          "پنیر کاتیج کم چرب",
          "ماست یونانی",
          "توفو",
        ],
      },
      {
        title: "جایگزین برنج",
        foods: [
          "سیب زمینی",
          "سیب زمینی شیرین",
          "جو دوسر",
          "ماکارونی سبوس‌دار",
          "کینوا",
          "دمپخت بدون روغن",
          "نان سبوس‌دار",
        ],
      },
      {
        title: "جایگزین جو دوسر",
        foods: [
          "نان سبوس‌دار",
          "برنج",
          "سیب زمینی",
          "کینوا",
          "کورن فلکس بدون شکر",
        ],
      },
      {
        title: "جایگزین سیب زمینی",
        foods: [
          "سیب زمینی شیرین",
          "برنج",
          "ماکارونی",
          "نان سبوس‌دار",
          "کدو حلوایی",
        ],
      },
      {
        title: "جایگزین ماکارونی و پاستا",
        foods: [
          "برنج",
          "سیب زمینی",
          "ماکارونی سبوس‌دار",
          "کینوا",
        ],
      },
      {
        title: "جایگزین ماست یونانی",
        foods: [
          "پنیر کاتیج کم چرب",
          "ماست پرپروتئین",
          "ماست کم چرب",
          "دوغ بدون گاز",
        ],
      },
      {
        title: "جایگزین شیر",
        foods: [
          "ماست کم چرب",
          "دوغ",
          "شیر بادام",
          "شیر سویا",
        ],
      },
      {
        title: "جایگزین پنیر",
        foods: [
          "پنیر کاتیج کم چرب",
          "ماست یونانی",
          "پنیر لبنه کم چرب",
        ],
      },
      {
        title: "جایگزین موز",
        foods: [
          "سیب",
          "پرتقال",
          "خرما",
          "توت فرنگی",
          "انگور",
        ],
      },
      {
        title: "جایگزین میوه",
        foods: [
          "سیب",
          "پرتقال",
          "کیوی",
          "توت فرنگی",
          "هلو",
          "گلابی",
        ],
      },
      {
        title: "جایگزین بادام",
        foods: [
          "گردو",
          "پسته",
          "فندق",
          "بادام زمینی",
          "تخمه کدو",
          "کره بادام زمینی",
        ],
      },
      {
        title: "جایگزین سبزیجات",
        foods: [
          "کاهو",
          "خیار",
          "گوجه فرنگی",
          "کلم بروکلی",
          "اسفناج",
          "هویج",
          "لوبیا سبز",
        ],
      },
      {
        title: "جایگزین سالاد",
        foods: [
          "سبزیجات بخارپز",
          "سالاد شیرازی",
          "کلم بروکلی",
          "اسفناج تازه",
        ],
      },
      {
        title: "جایگزین قهوه",
        foods: [
          "اسپرسو",
          "آمریکانو",
          "قهوه ترک",
          "چای سبز",
          "نسکافه بدون شکر",
        ],
      },
      {
        title: "جایگزین روغن",
        foods: [
          "روغن زیتون",
          "روغن کنجد",
          "آووکادو",
          "کره بادام زمینی",
        ],
      },
      {
        title: "جایگزین شکر",
        foods: [
          "خرما",
          "عسل",
          "استویا",
          "شیره انگور",
        ],
      },
    ],

    freeMeal: "هر هفته فقط یک وعده آزاد داری.",
  },
};
