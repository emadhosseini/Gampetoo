import type { WorkoutType } from "../types/program";

export interface Exercise {
  id: string;
  name: string;
  enabled: boolean;
  sets: number;
  reps: number;
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
            enabled: true,
            sets: 4,
            reps: 10,
          },
          {
            id: "incline-dumbbell-press",
            name: "پرس بالا سینه دمبل",
            enabled: true,
            sets: 3,
            reps: 10,
          },
          {
            id: "cable-fly",
            name: "فلای دستگاه یا کابل",
            enabled: true,
            sets: 3,
            reps: 12,
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
            enabled: true,
            sets: 3,
            reps: 10,
          },
          {
            id: "lateral-raise",
            name: "نشر جانب دمبل",
            enabled: true,
            sets: 3,
            reps: 12,
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
            enabled: true,
            sets: 3,
            reps: 12,
          },
          {
            id: "rope-pushdown",
            name: "پشت بازو طناب",
            enabled: true,
            sets: 3,
            reps: 12,
          },
        ],
      },
    ],
  },

  {
    id: "pull",
    title: "پول",
    groups: [],
  },

  {
    id: "legs",
    title: "پا",
    groups: [],
  },

  {
    id: "upper",
    title: "بالاتنه",
    groups: [],
  },

  {
    id: "lower",
    title: "پایین‌تنه",
    groups: [],
  },

  {
    id: "full_body",
    title: "کل بدن",
    groups: [],
  },

  {
    id: "cardio",
    title: "کاردیو",
    groups: [],
  },

  {
    id: "custom",
    title: "سفارشی",
    groups: [],
  },
];