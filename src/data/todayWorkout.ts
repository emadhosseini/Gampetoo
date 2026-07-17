export type Exercise = {
  id: number;
  name: string;
  sets: number;
  reps: string;
  muscle: string;
};

export const todayWorkout = {
  title: "تمرین امروز",
  day: "شنبه",

  exercises: [
    {
      id: 1,
      name: "پرس سینه هالتر",
      muscle: "سینه",
      sets: 4,
      reps: "8-10",
    },
    {
      id: 2,
      name: "پرس بالا سینه دمبل",
      muscle: "سینه",
      sets: 3,
      reps: "10-12",
    },
    {
      id: 3,
      name: "فلای دستگاه",
      muscle: "سینه",
      sets: 3,
      reps: "12-15",
    },
    {
      id: 4,
      name: "پرس سرشانه دمبل",
      muscle: "سرشانه",
      sets: 3,
      reps: "10-12",
    },
    {
      id: 5,
      name: "نشر جانب",
      muscle: "سرشانه",
      sets: 3,
      reps: "12-15",
    },
    {
      id: 6,
      name: "پشت بازو سیم‌کش",
      muscle: "پشت بازو",
      sets: 3,
      reps: "12-15",
    },
  ] satisfies Exercise[],
};