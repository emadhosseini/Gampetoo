import type { Program } from "../../types/program";
import { mealPlans } from "../nutrition/mealPlans";

export const defaultProgram: Program = {
  id: crypto.randomUUID(),

  name: "برنامه اصلی",

  startDate: "",

  active: true,

  workout: {
    days: [],

    workouts: [
      {
        id: "push",
        title: "Push",
        exercises: [
          {
            id: "1",
            name: "Bench Press",
            sets: 4,
            reps: "8-10",
          },
          {
            id: "2",
            name: "Incline Dumbbell Press",
            sets: 3,
            reps: "10-12",
          },
          {
            id: "3",
            name: "Shoulder Press",
            sets: 3,
            reps: "10-12",
          },
          {
            id: "4",
            name: "Lateral Raise",
            sets: 3,
            reps: "12-15",
          },
          {
            id: "5",
            name: "Triceps Pushdown",
            sets: 3,
            reps: "12-15",
          },
        ],
      },

      {
        id: "pull",
        title: "Pull",
        exercises: [
          {
            id: "6",
            name: "Lat Pulldown",
            sets: 4,
            reps: "8-10",
          },
          {
            id: "7",
            name: "Seated Row",
            sets: 3,
            reps: "10-12",
          },
          {
            id: "8",
            name: "Face Pull",
            sets: 3,
            reps: "12-15",
          },
          {
            id: "9",
            name: "Barbell Curl",
            sets: 3,
            reps: "10-12",
          },
          {
            id: "10",
            name: "Hammer Curl",
            sets: 3,
            reps: "10-12",
          },
        ],
      },

      {
        id: "legs",
        title: "Legs",
        exercises: [
          {
            id: "11",
            name: "Squat",
            sets: 4,
            reps: "8-10",
          },
          {
            id: "12",
            name: "Leg Press",
            sets: 3,
            reps: "10-12",
          },
          {
            id: "13",
            name: "Romanian Deadlift",
            sets: 3,
            reps: "10-12",
          },
          {
            id: "14",
            name: "Leg Curl",
            sets: 3,
            reps: "12-15",
          },
          {
            id: "15",
            name: "Standing Calf Raise",
            sets: 4,
            reps: "15-20",
          },
        ],
      },

      {
        id: "upper",
        title: "Upper",
        exercises: [],
      },

      {
        id: "lower",
        title: "Lower",
        exercises: [],
      },

      {
        id: "full_body",
        title: "Full Body",
        exercises: [],
      },

      {
        id: "cardio",
        title: "Cardio",
        exercises: [],
      },

      {
        id: "custom",
        title: "Custom",
        exercises: [],
      },
    ],
  },

  nutrition: {
    workout: mealPlans.workout,
    rest: mealPlans.rest,
  },

  settings: {
    autoRepeat: true,
  },
};