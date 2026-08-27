import { getMealSlots } from "@/data/nutrition/foodCatalog";

// Turns a whole day written out as text into per-meal groups of food lines:
//
//   صبحانه: ۳ عدد تخم‌مرغ کامل
//   میان‌وعده صبح: ۱۵۰ گرم ماست پروتئینی
//   ناهار: ۱۹۳ گرم سیب‌زمینی تنوری + ۱۵۰ گرم سینه مرغ
//
// Deliberately deterministic and offline. The AI parse (aiFoodParser.ts) is
// the fallback for lines this can't read, not the first thing reached for:
// the everyday shape of these texts is "<number> <unit> <food>", which needs
// no model to understand, and a local read is instant, free, and identical
// every time.

const FA_DIGITS = /[۰-۹]/g;
const AR_DIGITS = /[٠-٩]/g;

/** Persian/Arabic-script digits to ASCII, so Number() can read them. */
export function toEnDigits(value: string): string {
  return value
    .replace(FA_DIGITS, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(AR_DIGITS, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

// One normalizer for everything compared in this module. Beyond the usual
// Arabic-keyboard letters, it flattens ZWNJ (U+200C) to a space — "سیب‌زمینی"
// and "سیب زمینی" are the same food written two ways, and the catalog picks
// one of them per entry.
export function normalizeText(value: string): string {
  return toEnDigits(value)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Meal-slot ids are the app's own (see mealPlans.ts); everything on the
// right is what a person might actually type for that slot. Longest match
// wins, so "میان‌وعده صبح" isn't shadowed by "صبح".
const SLOT_ALIASES: Record<string, string[]> = {
  "wake-up": ["بعد از بیدار شدن", "بعد بیدار شدن", "ناشتا", "صبح زود", "wake up"],
  breakfast: ["صبحانه", "صبحونه", "breakfast"],
  "pre-workout": ["قبل از تمرین", "قبل تمرین", "پیش از تمرین", "پیش تمرین", "pre workout", "preworkout"],
  "post-workout": ["بعد از تمرین", "بعد تمرین", "پس از تمرین", "post workout", "postworkout"],
  lunch: ["ناهار", "نهار", "lunch"],
  snack: [
    "میان وعده صبح",
    "میان وعده عصر",
    "میان وعده",
    "میانوعده",
    "عصرانه",
    "اسنک",
    "snack",
  ],
  dinner: ["شام", "dinner"],
  "before-bed": ["قبل از خواب", "قبل خواب", "before bed", "bedtime"],
  supplements: ["مکمل ها", "مکمل‌ها", "مکمل", "ویتامین", "supplement", "supplements"],
};

// Longest first, so a label containing both "میان وعده صبح" and "صبح" can
// only ever resolve to the more specific of the two.
const ALIAS_INDEX: { slotId: string; alias: string }[] = Object.entries(SLOT_ALIASES)
  .flatMap(([slotId, aliases]) => aliases.map((alias) => ({ slotId, alias: normalizeText(alias) })))
  .sort((a, b) => b.alias.length - a.alias.length);

/** The slot a written meal label refers to, or null when it's unrecognized. */
export function resolveSlotId(label: string): string | null {
  const normalized = normalizeText(label);

  if (!normalized) return null;

  const known = new Set(getMealSlots().map((slot) => slot.id));
  const hit = ALIAS_INDEX.find((entry) => normalized.includes(entry.alias));

  return hit && known.has(hit.slotId) ? hit.slotId : null;
}

export interface TextSection {
  /** The resolved meal slot, or null when the label wasn't recognized. */
  slotId: string | null;
  /** The label exactly as written, for showing back to the user. */
  label: string;
  /** One entry per food written under this label. */
  lines: string[];
}

// A line is a meal header when it has a "label: rest" shape and the label is
// short enough to be a label rather than a sentence with a colon in it.
const HEADER = /^\s*([^:：]{1,40})\s*[:：]\s*(.*)$/;

// Foods within one meal are separated by any of these. Deliberately not
// " و " — plenty of single foods carry it in their own name.
const ITEM_SEPARATOR = /[+،,؛;]+/;

function splitItems(text: string): string[] {
  return text
    .split(ITEM_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Splits a day's text into its meal sections. Lines written under a header
 * without repeating it (a bare list) attach to the header above them, so
 * both of these read the same:
 *
 *   ناهار: ۲۰۰ گرم برنج + ۱۵۰ گرم مرغ
 *   ناهار:
 *   ۲۰۰ گرم برنج
 *   ۱۵۰ گرم مرغ
 *
 * Food lines before any header at all are dropped rather than guessed at —
 * there is no honest way to know which meal they belong to.
 */
export function splitDayText(text: string): TextSection[] {
  const sections: TextSection[] = [];
  let current: TextSection | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const header = line.match(HEADER);

    if (header) {
      current = { slotId: resolveSlotId(header[1]), label: header[1].trim(), lines: [] };
      sections.push(current);
      current.lines.push(...splitItems(header[2]));
      continue;
    }

    if (current) current.lines.push(...splitItems(line));
  }

  return sections.filter((section) => section.lines.length > 0);
}

// Units the app itself counts food in, plus the everyday synonyms. The value
// is the label to hand downstream — "کیلو" is not a unit any food carries,
// so it converts to grams instead (see parseFoodLine).
const UNIT_WORDS: Record<string, string> = {
  گرم: "گرم",
  گرمی: "گرم",
  g: "گرم",
  gr: "گرم",
  gram: "گرم",
  grams: "گرم",
  عدد: "عدد",
  تا: "عدد",
  دانه: "عدد",
  لیوان: "لیوان",
  فنجان: "فنجان",
  پیمانه: "پیمانه",
  پرس: "پرس",
  کاسه: "کاسه",
  بشقاب: "بشقاب",
  تکه: "تکه",
  برش: "برش",
  حبه: "حبه",
  مشت: "مشت",
  سیخ: "سیخ",
  فیله: "فیله",
  "قاشق غذاخوری": "قاشق غذاخوری",
  "قاشق چایخوری": "قاشق چایخوری",
  "قاشق مرباخوری": "قاشق چایخوری",
  قاشق: "قاشق غذاخوری",
  کیلو: "کیلوگرم",
  کیلوگرم: "کیلوگرم",
  kg: "کیلوگرم",
};

const UNIT_INDEX = Object.keys(UNIT_WORDS).sort((a, b) => b.length - a.length);

export interface ParsedFoodLine {
  name: string;
  quantity: number;
  /** Empty when the line named no unit — the food's own default is used. */
  unit: string;
}

// Written-out numbers, so "یک بشقاب قرمه سبزی" and "نیم لیوان شیر" don't
// have to travel to an AI parse just to learn they mean 1 and 0.5.
const WORD_NUMBERS: Record<string, string> = {
  نیم: "0.5",
  ربع: "0.25",
  یک: "1",
  یه: "1",
  دو: "2",
  سه: "3",
  چهار: "4",
  پنج: "5",
  شش: "6",
  هفت: "7",
  هشت: "8",
  نه: "9",
  ده: "10",
  نیمی: "0.5",
};

function replaceLeadingWordNumber(text: string): string {
  const [first, ...rest] = text.split(" ");
  const digit = WORD_NUMBERS[first];

  return digit === undefined ? text : [digit, ...rest].join(" ");
}

const NUMBER_FIRST = /^(\d+(?:[.,٫]\d+)?)\s+(.*)$/;
const NUMBER_LAST = /^(.*?)\s+(\d+(?:[.,٫]\d+)?)\s*([^\d]*)$/;

function readUnitPrefix(text: string): { unit: string; rest: string } {
  for (const word of UNIT_INDEX) {
    if (text === word) return { unit: UNIT_WORDS[word], rest: "" };
    if (text.startsWith(`${word} `)) {
      return { unit: UNIT_WORDS[word], rest: text.slice(word.length + 1).trim() };
    }
  }

  return { unit: "", rest: text };
}

/**
 * Reads one food line into (name, quantity, unit). Handles both orders that
 * turn up in practice — "۱۵۰ گرم ماست" and "ماست ۱۵۰ گرم" — and returns null
 * for anything with no number in it at all ("یک بشقاب قرمه سبزی"), which is
 * exactly what the AI fallback is for.
 *
 * A kilogram is converted to grams here rather than carried through: no food
 * in the catalog is counted in kilos, so leaving it would strand the line on
 * a unit nothing can match.
 */
export function parseFoodLine(line: string): ParsedFoodLine | null {
  const text = replaceLeadingWordNumber(
    normalizeText(line).replace(/[٫,](\d)/g, ".$1"),
  );

  const first = text.match(NUMBER_FIRST);

  if (first) {
    const { unit, rest } = readUnitPrefix(first[2].trim());
    const parsed = build(Number(first[1]), unit, rest);
    if (parsed) return parsed;
  }

  const last = text.match(NUMBER_LAST);

  if (last) {
    const { unit } = readUnitPrefix(last[3].trim());
    const parsed = build(Number(last[2]), unit, last[1].trim());
    if (parsed) return parsed;
  }

  return null;
}

function build(quantity: number, unit: string, name: string): ParsedFoodLine | null {
  if (!Number.isFinite(quantity) || quantity <= 0 || !name) return null;

  if (unit === "کیلوگرم") {
    return { name, quantity: quantity * 1000, unit: "گرم" };
  }

  return { name, quantity, unit };
}
