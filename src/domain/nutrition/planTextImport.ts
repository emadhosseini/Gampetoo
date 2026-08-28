import { getMealSlots } from "@/data/nutrition/foodCatalog";
import { macrosForServing } from "./foodSearch";
import { parseMealDescription, type AiExtractedFoodItem } from "./aiFoodParser";
import {
  findBestUnitMatch,
  findLocalMatch,
  matchAiExtractedItems,
  matchExtractedLocally,
} from "./aiFoodMatching";
import { parseFoodLine, splitDayText, stripDescriptors } from "./mealTextParser";
import { getActiveProgram, updateProgram } from "@/utils/programEngine";
import type { FoodItem as CatalogFood, ServingUnit } from "@/types/food";
import type { MealPlanType, MealSection } from "@/types/nutrition";

// Reads a whole day of eating, written as text, into the meal plan.
//
// Two passes, cheapest first. Everything written the ordinary way — "۱۵۰
// گرم ماست پروتئینی" — is read and matched entirely on this device: no
// network, no cost, no waiting, and the same answer every time. Only what
// that can't read ("یک بشقاب قرمه سبزی") or can't find in the catalog is
// handed to the AI parse, one call per meal, in parallel.

export interface ImportedFood {
  /** Stable identity for React keys and edits — the food may repeat. */
  key: string;
  food: CatalogFood;
  unit: ServingUnit;
  quantity: number;
  /** True when the numbers are the AI's own guess, not a catalog lookup. */
  estimated: boolean;
  /** The line as the user wrote it, so a wrong match is recognizable. */
  raw: string;
}

export interface ImportedMeal {
  /** Null when the written label matched no known meal — the user picks. */
  slotId: string | null;
  /** The label exactly as written. */
  label: string;
  items: ImportedFood[];
  /** Lines nothing could resolve. Reported, never silently dropped. */
  unresolved: string[];
}

export interface ImportResult {
  meals: ImportedMeal[];
  /** True when at least one line had to go to the AI parse. */
  usedAi: boolean;
  /** Set when the AI pass was needed but failed — the local half still stands. */
  aiError?: string;
}

function toExtracted(name: string, quantity: number, unit: string): AiExtractedFoodItem {
  return { name, quantity, unit };
}

async function resolveSection(
  label: string,
  slotId: string | null,
  lines: string[],
): Promise<{ meal: ImportedMeal; usedAi: boolean; aiError?: string }> {
  const parsed: { line: string; item: AiExtractedFoodItem }[] = [];
  const leftovers: string[] = [];

  for (const line of lines) {
    const read = parseFoodLine(line);

    if (read) {
      parsed.push({ line, item: toExtracted(read.name, read.quantity, read.unit) });
      continue;
    }

    // No amount written at all ("سالاد"). If the catalog knows the name,
    // that's still a local hit — one serving of the food's own default
    // unit — and sending it to an AI parse to be told the same thing would
    // be a round trip for nothing. The review screen shows the line it came
    // from, so a guessed amount is visible and editable before it lands.
    const named = findLocalMatch(stripDescriptors(line));

    if (named) {
      parsed.push({ line, item: toExtracted(named.nameFa, 1, "") });
      continue;
    }

    leftovers.push(line);
  }

  const local = matchExtractedLocally(parsed.map((entry) => entry.item));

  const items: ImportedFood[] = local.matched.map((match, index) => ({
    key: `${label}-local-${index}`,
    food: match.food,
    unit: match.unit,
    quantity: match.quantity,
    estimated: false,
    raw: parsed.find((entry) => entry.item.name === match.extracted.name)?.line ?? match.extracted.name,
  }));

  // A name the catalog doesn't know goes to the AI pass as its original
  // line, not as the stripped-down name: the model reads "۲۰۰ گرم سینه
  // بوقلمون" better than "سینه بوقلمون" with the amount thrown away.
  for (const missed of local.unmatched) {
    const original = parsed.find((entry) => entry.item.name === missed.extracted.name);
    leftovers.push(original?.line ?? missed.extracted.name);
  }

  if (leftovers.length === 0) {
    return { meal: { slotId, label, items, unresolved: [] }, usedAi: false };
  }

  const parseResult = await parseMealDescription(leftovers.join(" + "));

  if (!parseResult.ok) {
    return {
      meal: { slotId, label, items, unresolved: leftovers },
      usedAi: true,
      aiError: parseResult.error,
    };
  }

  const aiMatched = await matchAiExtractedItems(parseResult.items);

  aiMatched.matched.forEach((match, index) => {
    items.push({
      key: `${label}-ai-${index}`,
      food: match.food,
      unit: match.unit,
      quantity: match.quantity,
      estimated: match.estimated,
      raw: match.extracted.name,
    });
  });

  return {
    meal: {
      slotId,
      label,
      items,
      unresolved: aiMatched.unmatched.map((entry) => entry.extracted.name),
    },
    usedAi: true,
  };
}

export async function importDayText(text: string): Promise<ImportResult> {
  const sections = splitDayText(text);

  const resolved = await Promise.all(
    sections.map((section) => resolveSection(section.label, section.slotId, section.lines)),
  );

  return {
    meals: resolved.map((entry) => entry.meal),
    usedAi: resolved.some((entry) => entry.usedAi),
    aiError: resolved.find((entry) => entry.aiError)?.aiError,
  };
}

/** Recomputes one item's macros — used when the review screen edits it. */
export function itemMacros(item: ImportedFood) {
  return macrosForServing(item.food, item.unit, item.quantity);
}

export function unitFor(food: CatalogFood, label: string): ServingUnit {
  return findBestUnitMatch(food, label);
}

// A plan meal holds each food once, keyed by id (that's how the plan editor
// finds a selected food), so the same food written twice in one meal is
// summed rather than added twice — silently dropping the second would lose
// what the user actually wrote.
function toPlanFoods(items: ImportedFood[]) {
  const byId = new Map<string, { quantity: number; unit: ServingUnit; food: CatalogFood }>();

  for (const item of items) {
    const existing = byId.get(item.food.id);

    if (existing && existing.unit.label === item.unit.label) {
      existing.quantity += item.quantity;
      continue;
    }

    if (!existing) {
      byId.set(item.food.id, { quantity: item.quantity, unit: item.unit, food: item.food });
    }
  }

  return [...byId.values()].map(({ food, unit, quantity }) => ({
    id: food.id,
    name: food.nameFa,
    // Same "<quantity> <unit label>" convention the plan editor writes, in
    // ASCII digits — parseAmount (planFoodLogging) reads it back.
    amount: `${quantity} ${unit.label}`,
    ...macrosForServing(food, unit, quantity),
  }));
}

/**
 * Writes the reviewed result onto one of the two meal plans.
 *
 * Only the meals the text actually named are touched: each of those is
 * replaced outright by what was written, and every other meal in the plan
 * is left exactly as it was. That's what makes it safe to send just a
 * breakfast line without rewriting the rest of the day.
 */
export function applyImportToPlan(type: MealPlanType, meals: ImportedMeal[]) {
  const program = getActiveProgram();
  const existing = program.nutrition[type];
  const existingById = new Map(existing.meals.map((meal) => [meal.id, meal]));

  // Several written groups can name the same meal — "مکمل صبح" and "مکمل
  // ناهار" both belong to the one supplements slot — so their items are
  // pooled. Keyed last-one-wins instead, the second group would silently
  // replace the first.
  const imported = new Map<string, ImportedFood[]>();

  for (const meal of meals) {
    if (meal.slotId === null) continue;

    imported.set(meal.slotId, [...(imported.get(meal.slotId) ?? []), ...meal.items]);
  }

  const next: MealSection[] = getMealSlots().map((slot) => {
    const current = existingById.get(slot.id) ?? {
      id: slot.id,
      title: slot.title,
      icon: slot.icon,
      foods: [],
      enabled: false,
    };

    const incoming = imported.get(slot.id);

    if (!incoming) return current;

    const foods = toPlanFoods(incoming);

    // Same rule the plan editor applies when foods are picked by hand:
    // having foods is what makes a meal part of the plan.
    return { ...current, foods, enabled: foods.length > 0 };
  });

  updateProgram({
    ...program,
    nutrition: { ...program.nutrition, [type]: { ...existing, meals: next } },
  });
}
