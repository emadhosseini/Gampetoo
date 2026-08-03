const gregorianMonthNamesFa = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "می",
  "ژوئن",
  "جولای",
  "آگوست",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
];

/** e.g. "۲۲ جولای" — Persian digits/script, Gregorian calendar. */
export function formatGregorianShort(date: Date): string {
  const day = date.getDate().toLocaleString("fa-IR");
  const month = gregorianMonthNamesFa[date.getMonth()];

  return `${day} ${month}`;
}

/** e.g. "۲۲" — just the day-of-month, Persian digits, for dense chart x-axes. */
export function formatDayNumber(date: Date): string {
  return date.getDate().toLocaleString("fa-IR");
}

/** e.g. "۸" for August — the Gregorian month's 1-12 number, Persian digits. */
export function formatMonthNumber(date: Date): string {
  return (date.getMonth() + 1).toLocaleString("fa-IR");
}
