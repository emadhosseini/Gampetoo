import type { WorkoutType } from "../types/program";

export interface WarmupExercise {
  id: string;
  name: string;
}

export interface WarmupGroup {
  id: string;
  title: string;
  enabled: boolean;
  exercises: WarmupExercise[];
}

export interface SpecializedWarmup {
  workoutType: WorkoutType;
  title: string;
  groups: WarmupGroup[];
}

export const warmupLibrary: SpecializedWarmup[] = [
  {
    workoutType: "push",
    title: "گرم کردن پوش",
    groups: [
      {
        id: "joint-mobility",
        title: "تحرک مفصلی",
        enabled: false,
        exercises: [
          { id: "neck-rotation", name: "چرخش گردن" },
          { id: "shoulder-rotation", name: "چرخش شانه" },
          { id: "elbow-rotation", name: "چرخش آرنج" },
          { id: "wrist-rotation", name: "چرخش مچ دست" },
        ],
      },
      {
        id: "dynamic-stretching",
        title: "کشش پویا",
        enabled: false,
        exercises: [
          { id: "arm-circles", name: "چرخش دست‌ها" },
          { id: "arm-open-close", name: "باز و بسته کردن دست‌ها" },
          { id: "shoulder-rolls", name: "چرخش شانه" },
          { id: "dynamic-chest-stretch", name: "کشش پویای سینه" },
          { id: "band-shoulder-stretch", name: "کشش شانه با کش" },
        ],
      },
      {
        id: "muscle-activation",
        title: "فعال‌سازی عضلات",
        enabled: false,
        exercises: [
          { id: "band-pull-apart", name: "باز کردن کش روبه‌رو" },
          { id: "scapular-pushup", name: "شنا اسکاپولا" },
          { id: "wall-pushup", name: "شنا روی دیوار" },
          { id: "band-face-pull", name: "فیس پول با کش" },
          { id: "external-rotation", name: "چرخش خارجی شانه" },
        ],
      },
      {
        id: "prep-sets",
        title: "ست‌های آماده‌سازی",
        enabled: false,
        exercises: [
          { id: "empty-bar-bench-press", name: "پرس سینه با هالتر خالی" },
          { id: "40-percent-set", name: "۴۰٪ وزن اصلی" },
          { id: "60-percent-set", name: "۶۰٪ وزن اصلی" },
          { id: "80-percent-set", name: "۸۰٪ وزن اصلی" },
        ],
      },
    ],
  },

  {
    workoutType: "pull",
    title: "گرم کردن پول",
    groups: [
      {
        id: "joint-mobility",
        title: "تحرک مفصلی",
        enabled: false,
        exercises: [
          { id: "neck-rotation", name: "چرخش گردن" },
          { id: "shoulder-rotation", name: "چرخش شانه" },
          { id: "elbow-rotation", name: "چرخش آرنج" },
          { id: "wrist-rotation", name: "چرخش مچ دست" },
        ],
      },
      {
        id: "dynamic-stretching",
        title: "کشش پویا",
        enabled: false,
        exercises: [
          { id: "arm-open-close", name: "باز و بسته کردن دست‌ها" },
          { id: "dynamic-back-stretch", name: "کشش پویای عضلات پشت" },
          { id: "spine-rotation", name: "چرخش ستون فقرات" },
          { id: "cat-camel", name: "حرکت گربه و شتر" },
          { id: "scapular-mobility", name: "تحرک کتف" },
        ],
      },
      {
        id: "muscle-activation",
        title: "فعال‌سازی عضلات",
        enabled: false,
        exercises: [
          { id: "scapular-pullup", name: "بارفیکس اسکاپولا" },
          { id: "band-row", name: "قایقی با کش" },
          { id: "band-straight-arm-pulldown", name: "لت دست صاف با کش" },
          { id: "face-pull", name: "فیس پول" },
          { id: "dead-hang", name: "آویزان شدن از بارفیکس" },
        ],
      },
      {
        id: "prep-sets",
        title: "ست‌های آماده‌سازی",
        enabled: false,
        exercises: [
          { id: "light-lat-pulldown", name: "لت سبک" },
          { id: "light-row", name: "قایقی سبک" },
          { id: "light-biceps-curl", name: "جلو بازو سبک" },
          { id: "assisted-pullup", name: "بارفیکس کمکی" },
        ],
      },
    ],
  },

  {
    workoutType: "legs",
    title: "گرم کردن پا و شکم",
    groups: [
      {
        id: "joint-mobility",
        title: "تحرک مفصلی",
        enabled: false,
        exercises: [
          { id: "hip-rotation", name: "چرخش لگن" },
          { id: "knee-rotation", name: "چرخش زانو" },
          { id: "ankle-rotation", name: "چرخش مچ پا" },
          { id: "spine-rotation", name: "چرخش ستون فقرات" },
        ],
      },
      {
        id: "dynamic-stretching",
        title: "کشش پویا",
        enabled: false,
        exercises: [
          { id: "leg-swing-forward", name: "تاب دادن پا جلو و عقب" },
          { id: "leg-swing-lateral", name: "تاب دادن پا به طرفین" },
          { id: "walking-lunge", name: "لانج راه رفتنی" },
          { id: "bodyweight-squat", name: "اسکوات با وزن بدن" },
          { id: "hip-opener", name: "باز کردن لگن" },
          { id: "full-body-stretch", name: "کشش کامل بدن" },
        ],
      },
      {
        id: "muscle-activation",
        title: "فعال‌سازی عضلات",
        enabled: false,
        exercises: [
          { id: "glute-bridge", name: "پل باسن" },
          { id: "band-walk", name: "راه رفتن با کش" },
          { id: "band-knee-opener", name: "باز کردن زانو با کش" },
          { id: "dead-bug", name: "ددباگ" },
          { id: "bird-dog", name: "برد داگ" },
          { id: "plank", name: "پلانک" },
        ],
      },
      {
        id: "prep-sets",
        title: "ست‌های آماده‌سازی",
        enabled: false,
        exercises: [
          { id: "bodyweight-squat", name: "اسکوات با وزن بدن" },
          { id: "empty-bar-squat", name: "اسکوات با هالتر خالی" },
          { id: "40-percent-set", name: "۴۰٪ وزن اصلی" },
          { id: "60-percent-set", name: "۶۰٪ وزن اصلی" },
          { id: "80-percent-set", name: "۸۰٪ وزن اصلی" },
        ],
      },
    ],
  },

  {
    workoutType: "upper",
    title: "گرم کردن بالاتنه",
    groups: [
      {
        id: "joint-mobility",
        title: "تحرک مفصلی",
        enabled: false,
        exercises: [
          { id: "neck-rotation", name: "چرخش گردن" },
          { id: "shoulder-rotation", name: "چرخش شانه" },
          { id: "elbow-rotation", name: "چرخش آرنج" },
          { id: "wrist-rotation", name: "چرخش مچ دست" },
        ],
      },
      {
        id: "dynamic-stretching",
        title: "کشش پویا",
        enabled: false,
        exercises: [
          { id: "arm-circles", name: "چرخش دست‌ها" },
          { id: "chest-opener", name: "باز کردن سینه" },
          { id: "band-stretch", name: "کشش با کش" },
          { id: "spine-rotation", name: "چرخش ستون فقرات" },
          { id: "shoulder-mobility", name: "تحرک شانه" },
        ],
      },
      {
        id: "muscle-activation",
        title: "فعال‌سازی عضلات",
        enabled: false,
        exercises: [
          { id: "band-pull-apart", name: "باز کردن کش روبه‌رو" },
          { id: "face-pull", name: "فیس پول" },
          { id: "scapular-pushup", name: "شنا اسکاپولا" },
          { id: "band-row", name: "قایقی با کش" },
          { id: "external-rotation", name: "چرخش خارجی شانه" },
        ],
      },
      {
        id: "prep-sets",
        title: "ست‌های آماده‌سازی",
        enabled: false,
        exercises: [
          { id: "light-press", name: "پرس سبک" },
          { id: "light-lat-pulldown", name: "لت سبک" },
          { id: "light-row", name: "قایقی سبک" },
          { id: "light-raise", name: "نشر سبک" },
        ],
      },
    ],
  },

  {
    workoutType: "lower",
    title: "گرم کردن پایین‌تنه",
    groups: [
      {
        id: "joint-mobility",
        title: "تحرک مفصلی",
        enabled: false,
        exercises: [
          { id: "hip-rotation", name: "چرخش لگن" },
          { id: "knee-rotation", name: "چرخش زانو" },
          { id: "ankle-rotation", name: "چرخش مچ پا" },
          { id: "spine-rotation", name: "چرخش ستون فقرات" },
        ],
      },
      {
        id: "dynamic-stretching",
        title: "کشش پویا",
        enabled: false,
        exercises: [
          { id: "walking-lunge", name: "لانج راه رفتنی" },
          { id: "hip-opener", name: "باز کردن لگن" },
          { id: "bodyweight-squat", name: "اسکوات با وزن بدن" },
          { id: "leg-swing", name: "تاب دادن پا" },
          { id: "lateral-squat", name: "اسکوات پهلو" },
        ],
      },
      {
        id: "muscle-activation",
        title: "فعال‌سازی عضلات",
        enabled: false,
        exercises: [
          { id: "glute-bridge", name: "پل باسن" },
          { id: "band-walk", name: "راه رفتن با کش" },
          { id: "band-knee-opener", name: "باز کردن زانو با کش" },
          { id: "single-leg-glute-bridge", name: "پل باسن تک پا" },
          { id: "calf-raise", name: "ساق پا" },
        ],
      },
      {
        id: "prep-sets",
        title: "ست‌های آماده‌سازی",
        enabled: false,
        exercises: [
          { id: "light-squat", name: "اسکوات سبک" },
          { id: "light-lunge", name: "لانج سبک" },
          { id: "light-deadlift", name: "ددلیفت سبک" },
          { id: "light-hip-thrust", name: "هیپ تراست سبک" },
        ],
      },
    ],
  },

  {
    workoutType: "full_body",
    title: "گرم کردن تمام بدن",
    groups: [
      {
        id: "joint-mobility",
        title: "تحرک مفصلی",
        enabled: false,
        exercises: [
          { id: "neck", name: "گردن" },
          { id: "shoulder", name: "شانه" },
          { id: "spine", name: "ستون فقرات" },
          { id: "hip", name: "لگن" },
          { id: "knee", name: "زانو" },
          { id: "ankle", name: "مچ پا" },
        ],
      },
      {
        id: "dynamic-stretching",
        title: "کشش پویا",
        enabled: false,
        exercises: [
          { id: "full-body-stretch", name: "کشش کامل بدن" },
          { id: "arm-circles", name: "چرخش دست‌ها" },
          { id: "leg-swing", name: "تاب دادن پا" },
          { id: "walking-lunge", name: "لانج راه رفتنی" },
          { id: "bodyweight-squat", name: "اسکوات با وزن بدن" },
          { id: "spine-rotation", name: "چرخش ستون فقرات" },
        ],
      },
      {
        id: "muscle-activation",
        title: "فعال‌سازی عضلات",
        enabled: false,
        exercises: [
          { id: "glute-bridge", name: "پل باسن" },
          { id: "band-pull-apart", name: "باز کردن کش روبه‌رو" },
          { id: "dead-bug", name: "ددباگ" },
          { id: "bird-dog", name: "برد داگ" },
          { id: "scapular-pushup", name: "شنا اسکاپولا" },
          { id: "plank", name: "پلانک" },
        ],
      },
      {
        id: "prep-sets",
        title: "ست‌های آماده‌سازی",
        enabled: false,
        exercises: [
          { id: "light-squat", name: "اسکوات سبک" },
          { id: "light-press", name: "پرس سبک" },
          { id: "light-lat-pulldown", name: "لت سبک" },
          { id: "light-deadlift", name: "ددلیفت سبک" },
          {
            id: "first-move-40-60-percent",
            name: "اجرای حرکت اول برنامه با ۴۰٪ و ۶۰٪ وزن",
          },
        ],
      },
    ],
  },
];
