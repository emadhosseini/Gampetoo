import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { getCurrentUserName } from "@/utils/userEngine";

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

function formatToday() {
  const now = new Date();

  const jalali = new DateObject({
    date: now,
    calendar: persian,
    locale: persian_fa,
  });

  const weekday = jalali.format("dddd");
  const jalaliDay = jalali.format("D");
  const jalaliMonth = jalali.format("MMMM");

  const gregorianDay = now.getDate().toLocaleString("fa-IR");
  const gregorianMonth = gregorianMonthNamesFa[now.getMonth()];

  return `${weekday}، ${gregorianDay} ${gregorianMonth} (${jalaliDay} ${jalaliMonth}ماه)`;
}

function Header() {
  const today = formatToday();
  const userName = getCurrentUserName() ?? "";

  return (
    <header className="px-6 pt-8 pb-6 text-center">
      <p className="text-sm text-zinc-400">
        سلام {userName} 👋
      </p>

      <h1 className="mt-2 text-3xl font-bold">
        امروز چه برنامه‌ای داری؟
      </h1>

      <p className="mt-3 text-sm text-zinc-500">
        {today}
      </p>
    </header>
  );
}

export default Header;