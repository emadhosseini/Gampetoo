import type { WorkoutType } from "../types/program";

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  enabled: boolean;
}

export interface ExerciseGroup {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface WorkoutDefinition {
  id: WorkoutType;
  title: string;
  groups: ExerciseGroup[];
}

export const workoutLibrary: WorkoutDefinition[] = [
  {
    id: "push",
    title: "پوش",
    groups: [
      {
        id: "chest",
        title: "سینه",
        exercises: [
          {
            id: "machine-bench-press",
            name: "پرس سینه دستگاه",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "incline-dumbbell-press",
            name: "پرس بالا سینه دمبل",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "cable-fly",
            name: "فلای دستگاه یا کابل",
            sets: 3,
            reps: 10,
            enabled: false,
          },
        ],
      },
      {
        id: "shoulders",
        title: "سرشانه",
        exercises: [
          {
            id: "machine-shoulder-press",
            name: "پرس سرشانه دستگاه",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "lateral-raise",
            name: "نشر جانب دمبل",
            sets: 3,
            reps: 10,
            enabled: false,
          },
        ],
      },
      {
        id: "triceps",
        title: "پشت بازو",
        exercises: [
          {
            id: "cable-pushdown",
            name: "پشت بازو سیم‌کش",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "rope-pushdown",
            name: "پشت بازو طناب",
            sets: 3,
            reps: 10,
            enabled: false,
          },
        ],
      },
    ],
  },

  {
    id: "pull",
    title: "پول",
    groups: [
      {
        id: "back",
        title: "پشت",
        exercises: [
          {
            id: "lat-pulldown",
            name: "لت سیم‌کش",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "seated-row",
            name: "قایقی",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "t-bar-row",
            name: "تی‌بار یا پارویی دستگاه",
            sets: 3,
            reps: 10,
            enabled: false,
          },
        ],
      },
      {
        id: "rear-shoulder",
        title: "پشت شانه",
        exercises: [
          {
            id: "face-pull",
            name: "فیس پول",
            sets: 3,
            reps: 10,
            enabled: false,
          },
        ],
      },
      {
        id: "biceps",
        title: "جلو بازو",
        exercises: [
          {
            id: "barbell-curl",
            name: "جلو بازو هالتر",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "alternating-dumbbell-curl",
            name: "جلو بازو دمبل تناوبی",
            sets: 3,
            reps: 10,
            enabled: false,
          },
        ],
      },
    ],
  },

  {
    id: "legs",
    title: "پا + شکم",
    groups: [
      {
        id: "legs",
        title: "پا",
        exercises: [
          {
            id: "leg-press",
            name: "پرس پا",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "machine-squat",
            name: "اسکوات دستگاه",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "leg-extension",
            name: "جلو پا",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "lying-leg-curl",
            name: "پشت پا خوابیده",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "calf-raise",
            name: "ساق پا",
            sets: 3,
            reps: 10,
            enabled: false,
          },
        ],
      },
      {
        id: "abs",
        title: "شکم",
        exercises: [
          {
            id: "crunch",
            name: "کرانچ",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "leg-raise",
            name: "بالا آوردن پا",
            sets: 3,
            reps: 10,
            enabled: false,
          },
          {
            id: "plank",
            name: "پلانک",
            sets: 3,
            reps: 10,
            enabled: false,
          },
        ],
      },
    ],
  },
];