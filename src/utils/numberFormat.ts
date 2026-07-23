const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Converts any ASCII digits in a number/string to Persian-script digits, leaving everything else (e.g. a "." decimal point) untouched. */
export function toFaDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]);
}
