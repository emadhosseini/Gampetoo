import { useState } from "react";
import { Activity, UtensilsCrossed } from "lucide-react";

import PillTabBar, { type PillTabBarItem } from "@/components/PillTabBar";

type Tab = "meal" | "activity";

const tabs: PillTabBarItem<Tab>[] = [
  { id: "meal", label: "وعده غذایی", icon: UtensilsCrossed },
  { id: "activity", label: "فعالیت", icon: Activity },
];

// Where calories eaten and exercise/activity done get logged. The tab
// content itself is still a placeholder — this page just replaces the old
// settings hub (its nav shortcuts all now live in SideMenu/ProfilePage).
export default function DailyLogPage() {
  const [tab, setTab] = useState<Tab>("meal");

  return (
    <div>
      <h1 className="px-5 pt-10 text-center text-2xl font-bold text-white">
        ثبت روزانه
      </h1>

      <PillTabBar
        items={tabs}
        active={tab}
        onChange={setTab}
        layoutId="daily-log-tab-selection"
      />

      <div className="flex min-h-[40vh] flex-col items-center justify-center px-5 text-center">
        <p className="text-white">این بخش به‌زودی اضافه می‌شود.</p>
      </div>
    </div>
  );
}
