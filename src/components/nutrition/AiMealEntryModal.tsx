import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import type { MealSlot } from "@/data/nutrition/foodCatalog";

export interface AiMealEntryModalProps {
  meal: MealSlot | null;
  onClose: () => void;
}

// Free-text "describe what you ate" entry point for AI-computed calorie
// logging. The actual AI calculation isn't built yet — "محاسبه" is a
// placeholder for now (shows a coming-soon note instead of pretending to
// compute something), same honesty the app already uses elsewhere for
// features that aren't wired up yet (e.g. DailyLogPage's "فعالیت" tab).
export default function AiMealEntryModal({ meal, onClose }: AiMealEntryModalProps) {
  const [description, setDescription] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    // Reset every time a different meal's modal opens.
    setDescription("");
    setShowComingSoon(false);
  }, [meal]);

  if (!meal) {
    return null;
  }

  function handleCalculate() {
    if (!description.trim()) return;

    setShowComingSoon(true);
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6">
        <h2 className="flex items-center justify-center gap-2 text-center text-lg font-bold text-white">
          <Sparkles size={20} className="text-avocado-yellow" />
          افزودن با هوش مصنوعی به وعده {meal.title}
        </h2>

        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setShowComingSoon(false);
          }}
          placeholder="مثلاً: یک بشقاب چلوکباب با یک لیوان دوغ"
          rows={4}
          className="glass-chip w-full resize-none rounded-xl p-3 text-sm text-white placeholder:text-white/50 outline-none"
        />

        {showComingSoon && (
          <p className="text-center text-sm text-avocado-yellow">
            این قابلیت به‌زودی تکمیل می‌شه.
          </p>
        )}

        <button
          onClick={handleCalculate}
          disabled={!description.trim()}
          className="glass-tap w-full rounded-2xl bg-avocado-yellow py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          محاسبه
        </button>

        <button
          onClick={onClose}
          className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
        >
          بستن
        </button>
      </div>
    </ModalOverlay>
  );
}
