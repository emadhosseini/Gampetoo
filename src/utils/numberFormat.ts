import { getAppSettings } from "./appSettingsEngine";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/**
 * Converts any ASCII digits in a number/string to Persian-script digits,
 * leaving everything else (e.g. a "." decimal point) untouched — but only
 * under the فارسی language setting. Every call site across the app calls
 * this unconditionally (it predates the language setting entirely), so the
 * English/Gregorian branch has to live here rather than at each of those
 * call sites: under English this is a no-op passthrough, so English users
 * see plain ASCII digits everywhere this is already called.
 */
export function toFaDigits(value: number | string): string {
  if (getAppSettings().language === "en") return String(value);

  return String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]);
}
