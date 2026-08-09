import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import WaitingDots from "@/components/WaitingDots";
import type { MealSlot } from "@/data/nutrition/foodCatalog";
import { parseMealDescription } from "@/domain/nutrition/aiFoodParser";
import {
  matchAiExtractedItems,
  type MatchedAiFoodItem,
  type UnmatchedAiFoodItem,
} from "@/domain/nutrition/aiFoodMatching";
import { addLoggedEntry } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface AiMealEntryModalProps {
  meal: MealSlot | null;
  onClose: () => void;
  // Bumped after every add/remove so the card behind the modal shows the
  // fresh totals once this closes — matches AddMealEntryModal's contract.
  onChange: () => void;
}

type Screen =
  | { step: "input" }
  | { step: "loading" }
  | { step: "results"; matched: MatchedAiFoodItem[]; unmatched: UnmatchedAiFoodItem[] }
  | { step: "error"; message: string };

// Free-text "describe what you ate" entry point for AI-computed calorie
// logging. Sends the description to the parse-meal Supabase Edge Function
// (which holds the Gemini key server-side — see
// src/domain/nutrition/aiFoodParser.ts), matches whatever it extracts
// against the app's real local food database (aiFoodMatching.ts), and lets
// the user confirm before anything is actually logged.
export default function AiMealEntryModal({ meal, onClose, onChange }: AiMealEntryModalProps) {
  const [description, setDescription] = useState("");
  const [screen, setScreen] = useState<Screen>({ step: "input" });

  useEffect(() => {
    // Reset every time a different meal's modal opens.
    setDescription("");
    setScreen({ step: "input" });
  }, [meal]);

  if (!meal) {
    return null;
  }

  async function handleCalculate() {
    const trimmed = description.trim();
    if (!trimmed) return;

    setScreen({ step: "loading" });

    const result = await parseMealDescription(trimmed);

    if (!result.ok) {
      setScreen({ step: "error", message: result.error ?? "خطایی پیش اومد." });
      return;
    }

    const { matched, unmatched } = await matchAiExtractedItems(result.items);

    if (matched.length === 0) {
      setScreen({
        step: "error",
        message: "هیچ‌کدوم از خوراکی‌هایی که نوشتی توی دیتابیس پیدا نشد.",
      });
      return;
    }

    setScreen({ step: "results", matched, unmatched });
  }

  function handleConfirmAdd() {
    if (screen.step !== "results") return;

    for (const item of screen.matched) {
      const macros = {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
      };

      addLoggedEntry(meal!.id, {
        name: item.food.nameFa,
        amount: `${toFaDigits(item.quantity)} ${item.unit.label}`,
        // Same editable-amount basis the manual flow records — the AI's
        // guess at how much you ate is exactly the one most worth
        // correcting afterwards.
        quantity: item.quantity,
        unitLabel: item.unit.label,
        base: { quantity: item.quantity, ...macros },
        ...macros,
      });
    }

    onChange();
    onClose();
  }

  function handleRetry() {
    setScreen({ step: "input" });
  }

  const totalCalories =
    screen.step === "results" ? screen.matched.reduce((sum, m) => sum + m.calories, 0) : 0;
  const totalProtein =
    screen.step === "results" ? screen.matched.reduce((sum, m) => sum + m.protein, 0) : 0;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6">
        <h2 className="flex items-center justify-center gap-2 text-center text-lg font-bold text-white">
          <Sparkles size={20} className="text-avocado-yellow" />
          افزودن با هوش مصنوعی به وعده {meal.title}
        </h2>

        {(screen.step === "input" || screen.step === "loading") && (
          <>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثلاً: یک بشقاب چلوکباب با یک لیوان دوغ"
              rows={4}
              disabled={screen.step === "loading"}
              className="glass-chip w-full resize-none rounded-xl p-3 text-sm text-white placeholder:text-white/50 outline-none disabled:opacity-60"
            />

            <button
              onClick={() => void handleCalculate()}
              disabled={!description.trim() || screen.step === "loading"}
              className="w-full glass-action rounded-2xl py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {screen.step === "loading" ? <WaitingDots /> : "محاسبه"}
            </button>
          </>
        )}

        {screen.step === "error" && (
          <div className="space-y-4">
            <p className="text-center text-sm text-avocado-yellow">{screen.message}</p>
            <button
              onClick={handleRetry}
              className="w-full glass-action rounded-2xl py-3 font-bold text-white"
            >
              تلاش دوباره
            </button>
          </div>
        )}

        {screen.step === "results" && (
          <AnimatePresence initial={false}>
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="space-y-2">
                {screen.matched.map((item, i) => (
                  <motion.div
                    key={`${item.food.id}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-chip flex items-center justify-between rounded-xl p-3 text-sm text-white"
                  >
                    <span className="font-medium">
                      {item.food.nameFa}
                      <span className="mr-1 text-white/60">
                        ({toFaDigits(item.quantity)} {item.unit.label})
                      </span>
                      {item.estimated && (
                        <span className="glass-chip mr-1 rounded-full px-2 py-0.5 text-[10px] text-avocado-yellow">
                          تخمینی
                        </span>
                      )}
                    </span>
                    <span className="text-white/70">
                      {toFaDigits(item.calories)} کالری · {toFaDigits(item.protein)} گرم پروتئین
                    </span>
                  </motion.div>
                ))}
              </div>

              {screen.unmatched.length > 0 && (
                <div className="space-y-1 rounded-xl border border-dashed border-white/20 p-3">
                  <p className="text-xs text-white/60">
                    این موارد پیدا نشدن و اضافه نمی‌شن:
                  </p>
                  {screen.unmatched.map((item, i) => (
                    <p key={i} className="text-xs text-white/50">
                      {item.extracted.name}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-center text-sm font-semibold text-white">
                جمع کالری: {toFaDigits(totalCalories)} · جمع پروتئین: {toFaDigits(totalProtein)} گرم
              </p>

              <button
                onClick={handleConfirmAdd}
                className="w-full glass-action rounded-2xl py-3 font-bold text-white"
              >
                افزودن به وعده
              </button>

              <button
                onClick={handleRetry}
                className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
              >
                بازگشت
              </button>
            </motion.div>
          </AnimatePresence>
        )}

        {screen.step !== "results" && (
          <button
            onClick={onClose}
            className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
          >
            بستن
          </button>
        )}
      </div>
    </ModalOverlay>
  );
}
