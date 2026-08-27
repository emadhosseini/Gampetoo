import { useEffect, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import WaitingDots from "@/components/WaitingDots";
import { getMealSlots } from "@/data/nutrition/foodCatalog";
import {
  applyImportToPlan,
  importDayText,
  itemMacros,
  unitFor,
  type ImportedMeal,
} from "@/domain/nutrition/planTextImport";
import { toFaDigits } from "@/utils/numberFormat";
import type { MealPlanType } from "@/types/nutrition";

const PLACEHOLDER = `صبحانه: ۳ عدد تخم‌مرغ کامل
میان‌وعده صبح: ۱۵۰ گرم ماست پروتئینی
ناهار: ۱۹۳ گرم سیب‌زمینی تنوری + ۱۵۰ گرم سینه مرغ
شام: ۲۰۰ گرم ماهی`;

const PLAN_TITLES: Record<MealPlanType, string> = {
  workout: "برنامه‌ی روز تمرین",
  rest: "برنامه‌ی روز استراحت",
};

export interface PlanTextImportModalProps {
  open: boolean;
  /** Which of the two plans the text is written onto. */
  planType: MealPlanType;
  onClose: () => void;
  /** Fired after the plan was actually written. */
  onApplied: () => void;
}

type Screen =
  | { step: "input" }
  | { step: "loading" }
  | { step: "review"; usedAi: boolean; aiError?: string }
  | { step: "error"; message: string };

// "برنامه‌ات رو بنویس" — a whole day of eating pasted as text, read into the
// meal plan. Nothing is written until the result has been reviewed: one bad
// match in a seven-line text would otherwise be seven wrong foods.
export default function PlanTextImportModal({
  open,
  planType,
  onClose,
  onApplied,
}: PlanTextImportModalProps) {
  const [text, setText] = useState("");
  const [meals, setMeals] = useState<ImportedMeal[]>([]);
  const [screen, setScreen] = useState<Screen>({ step: "input" });

  useEffect(() => {
    if (!open) return;

    setText("");
    setMeals([]);
    setScreen({ step: "input" });
  }, [open]);

  if (!open) return null;

  const slots = getMealSlots();

  async function handleRead() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setScreen({ step: "loading" });

    const result = await importDayText(trimmed);
    const total = result.meals.reduce((sum, meal) => sum + meal.items.length, 0);

    if (total === 0) {
      setScreen({
        step: "error",
        message:
          result.aiError ??
          "چیزی از متن خونده نشد. هر خط رو به شکل «صبحانه: ۲ عدد تخم مرغ» بنویس.",
      });
      return;
    }

    setMeals(result.meals);
    setScreen({ step: "review", usedAi: result.usedAi, aiError: result.aiError });
  }

  function updateItem(
    mealIndex: number,
    key: string,
    change: { quantity?: number; unitLabel?: string },
  ) {
    setMeals((prev) =>
      prev.map((meal, index) => {
        if (index !== mealIndex) return meal;

        return {
          ...meal,
          items: meal.items.map((item) => {
            if (item.key !== key) return item;

            return {
              ...item,
              quantity: change.quantity ?? item.quantity,
              unit:
                change.unitLabel === undefined
                  ? item.unit
                  : unitFor(item.food, change.unitLabel),
            };
          }),
        };
      }),
    );
  }

  function removeItem(mealIndex: number, key: string) {
    setMeals((prev) =>
      prev.map((meal, index) =>
        index !== mealIndex
          ? meal
          : { ...meal, items: meal.items.filter((item) => item.key !== key) },
      ),
    );
  }

  function assignSlot(mealIndex: number, slotId: string) {
    setMeals((prev) =>
      prev.map((meal, index) => (index === mealIndex ? { ...meal, slotId } : meal)),
    );
  }

  const writable = meals.filter((meal) => meal.slotId !== null && meal.items.length > 0);

  function handleApply() {
    applyImportToPlan(planType, writable);
    onApplied();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">
          نوشتن برنامه با متن
        </h2>

        <p className="text-center text-xs text-white/50">
          روی {PLAN_TITLES[planType]} نوشته می‌شه
        </p>

        {screen.step === "input" && (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={PLACEHOLDER}
              className="glass-chip w-full rounded-xl p-3 text-sm leading-7 text-white placeholder:text-white/35 outline-none"
            />

            <p className="text-xs leading-relaxed text-white/50">
              فقط وعده‌هایی که توی متن نوشتی جایگزین می‌شن؛ بقیه دست‌نخورده
              می‌مونن.
            </p>

            <button
              onClick={() => void handleRead()}
              disabled={!text.trim()}
              className="w-full glass-action rounded-2xl py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              خواندن متن
            </button>
          </>
        )}

        {screen.step === "loading" && (
          <div className="py-8 text-center">
            <WaitingDots />
            <p className="mt-3 text-sm text-white/60">در حال خواندن متن...</p>
          </div>
        )}

        {screen.step === "error" && (
          <>
            <p className="rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-300">
              {screen.message}
            </p>

            <button
              onClick={() => setScreen({ step: "input" })}
              className="w-full glass-action rounded-2xl py-3 font-bold text-white"
            >
              دوباره
            </button>
          </>
        )}

        {screen.step === "review" && (
          <>
            {screen.aiError && (
              <p className="rounded-xl bg-amber-500/10 p-3 text-center text-xs text-amber-300">
                بعضی خط‌ها نیاز به هوش مصنوعی داشتن و ازش جواب نگرفتیم:{" "}
                {screen.aiError}
              </p>
            )}

            {meals.map((meal, mealIndex) => (
              <div key={`${meal.label}-${mealIndex}`} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{meal.label}</span>

                  {meal.slotId === null && (
                    <select
                      value=""
                      onChange={(e) => assignSlot(mealIndex, e.target.value)}
                      aria-label="انتخاب وعده"
                      className="glass-static glass-chip rounded-lg px-2 py-1 text-xs text-white"
                    >
                      <option value="">کدوم وعده‌ست؟</option>

                      {slots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {meal.items.map((item) => {
                  const macros = itemMacros(item);

                  return (
                    <div
                      key={item.key}
                      className="glass-chip glass-static space-y-2 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-semibold text-white">
                          {item.food.nameFa}
                        </span>

                        {item.estimated && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">
                            <Sparkles size={10} />
                            تخمینی
                          </span>
                        )}

                        <button
                          onClick={() => removeItem(mealIndex, item.key)}
                          aria-label={`حذف ${item.food.nameFa}`}
                          className="shrink-0 text-white/40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(mealIndex, item.key, {
                              quantity: Number(e.target.value),
                            })
                          }
                          aria-label="مقدار"
                          className="w-16 glass-chip rounded-lg px-2 py-1 text-center text-sm text-white"
                        />

                        <select
                          value={item.unit.label}
                          onChange={(e) =>
                            updateItem(mealIndex, item.key, { unitLabel: e.target.value })
                          }
                          aria-label="واحد"
                          className="glass-static glass-chip flex-1 rounded-lg px-2 py-1 text-sm text-white"
                        >
                          {item.food.servingUnits.map((unit) => (
                            <option key={unit.label} value={unit.label}>
                              {unit.label}
                            </option>
                          ))}
                        </select>

                        <span className="shrink-0 text-xs text-white/60">
                          {toFaDigits(macros.calories)} کالری
                        </span>
                      </div>

                      {/* What the line said, so a wrong match is obvious
                          before it's written into the plan. */}
                      <p className="text-[10px] text-white/35">«{item.raw}»</p>
                    </div>
                  );
                })}

                {meal.unresolved.length > 0 && (
                  <p className="rounded-xl bg-white/5 p-2 text-[11px] text-white/50">
                    شناخته نشد: {meal.unresolved.join("، ")}
                  </p>
                )}
              </div>
            ))}

            <button
              onClick={handleApply}
              disabled={writable.length === 0}
              className="w-full glass-action rounded-2xl py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              نوشتن روی برنامه
            </button>
          </>
        )}

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
