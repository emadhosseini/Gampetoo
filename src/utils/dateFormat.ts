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

/** e.g. "جولای" — just the Gregorian month name, for monthly-bucketed charts. */
export function formatGregorianMonth(date: Date): string {
  return gregorianMonthNamesFa[date.getMonth()];
}
