import { useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import Toggle from "@/components/Toggle";
import { getMealSlots } from "@/data/nutrition/foodCatalog";
import {
  getAppSettings,
  getMealDisplaySettings,
  saveAppSettings,
  type MealCardDefault,
} from "@/utils/appSettingsEngine";

const CARD_DEFAULT_LABELS: Record<MealCardDefault, string> = {
  auto: "خودکار",
  expanded: "باز",
  collapsed: "بسته",
};

const CARD_DEFAULT_HINTS: Record<MealCardDefault, string> = {
  auto: "وعده‌ای که چیزی توش ثبت شده باز باشه",
  expanded: "همه باز",
  collapsed: "همه بسته",
};

const CARD_DEFAULTS: MealCardDefault[] = ["auto", "expanded", "collapsed"];

export interface MealDisplaySettingsModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired after saving, so the page behind can re-read what it shows. */
  onSaved: () => void;
}

// Which meals show up at all, and whether their cards start open. Both are
// display-only: hiding "بعد از بیدار شدن" doesn't delete anything logged or
// planned under it, it just stops it taking up the screen every day for
// someone who doesn't eat then.
export default function MealDisplaySettingsModal({
  open,
  onClose,
  onSaved,
}: MealDisplaySettingsModalProps) {
  const [hidden, setHidden] = useState<string[]>(
    () => getMealDisplaySettings().hiddenMealIds,
  );
  const [cardDefault, setCardDefault] = useState<MealCardDefault>(
    () => getMealDisplaySettings().mealCardDefault,
  );

  if (!open) return null;

  const slots = getMealSlots();
  const visibleCount = slots.length - hidden.length;

  function toggleMeal(id: string) {
    setHidden((prev) =>
      prev.includes(id) ? prev.filter((mealId) => mealId !== id) : [...prev, id],
    );
  }

  function handleSave() {
    saveAppSettings({
      ...getAppSettings(),
      hiddenMealIds: hidden,
      mealCardDefault: cardDefault,
    });

    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">
          نمایش وعده‌های غذایی
        </h2>

        <p className="text-center text-xs leading-relaxed text-white/50">
          وعده‌ای که خاموش کنی فقط از صفحه‌ها برداشته می‌شه — چیزی که توش ثبت
          یا برنامه‌ریزی کردی پاک نمی‌شه.
        </p>

        <div className="space-y-2">
          {slots.map((slot) => {
            const shown = !hidden.includes(slot.id);

            return (
              <div
                key={slot.id}
                className="glass-chip glass-static flex items-center gap-3 rounded-xl p-3"
              >
                <Toggle checked={shown} onChange={() => toggleMeal(slot.id)} />

                <span className="text-lg">{slot.icon}</span>

                <span className="flex-1 text-sm font-semibold text-white">
                  {slot.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Turning every meal off would leave a page with nothing on it and
            no way back except this same popup — said out loud rather than
            blocked, since it's still the user's call. */}
        {visibleCount === 0 && (
          <p className="rounded-xl bg-amber-500/10 p-3 text-center text-xs text-amber-300">
            همه‌ی وعده‌ها خاموشن — صفحه‌ی وعده‌ها خالی نشون داده می‌شه.
          </p>
        )}

        <div className="space-y-2">
          <p className="text-sm text-white/60">کارت وعده‌ها اولش</p>

          <div className="flex gap-2">
            {CARD_DEFAULTS.map((option) => (
              <button
                key={option}
                onClick={() => setCardDefault(option)}
                className={`flex-1 rounded-xl px-2 py-3 text-center transition-colors ${
                  cardDefault === option ? "glass-selected" : "glass-chip"
                }`}
              >
                <span className="block text-sm font-bold text-white">
                  {CARD_DEFAULT_LABELS[option]}
                </span>

                <span className="mt-0.5 block text-[10px] leading-4 text-white/50">
                  {CARD_DEFAULT_HINTS[option]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white"
        >
          ذخیره
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
