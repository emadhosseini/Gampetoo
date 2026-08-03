import { useState } from "react";

import WeightPicker from "@/components/WeightPicker";
import { getLatestWeight, getTodaysWeight, logWeight } from "@/utils/weightEngine";

export default function WeightTrackerPage() {
  const [weight, setWeight] = useState(() => getLatestWeight() ?? 50);
  const [saved, setSaved] = useState(false);
  const [alreadyLoggedToday, setAlreadyLoggedToday] = useState(() => getTodaysWeight() !== null);

  function handleLog() {
    logWeight(weight);
    setSaved(true);
    setAlreadyLoggedToday(true);
  }

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      <h1 className="text-center text-2xl font-bold text-white">
        ثبت وزن
      </h1>

      <div className="glass-panel glass-static rounded-2xl p-4 text-center">
        <label className="mb-3 block text-sm text-white">
          {alreadyLoggedToday ? "وزن امروزت رو ویرایش کن" : "وزن امروزت رو وارد کن"}
        </label>

        <WeightPicker
          value={weight}
          onChange={(newWeight) => {
            setWeight(newWeight);
            setSaved(false);
          }}
        />

        <button
          onClick={handleLog}
          className="mt-4 w-full rounded-2xl glass-action py-3 text-lg font-bold text-white"
        >
          {saved ? "ثبت شد ✅" : alreadyLoggedToday ? "بروزرسانی وزن" : "ثبت وزن"}
        </button>
      </div>
    </div>
  );
}
