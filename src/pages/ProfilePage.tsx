import { useState } from "react";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AccountEditModal from "@/components/AccountEditModal";
import { getCurrentUserName } from "@/utils/userEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

export default function ProfilePage() {
  const navigate = useNavigate();
  const userName = getCurrentUserName() ?? "";
  const weight = getLatestWeight();
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <h1 className="text-center text-2xl font-bold text-white">
        حساب کاربری
      </h1>

      <button
        onClick={() => setAccountModalOpen(true)}
        className="glass-panel flex w-full items-stretch justify-between gap-4 rounded-3xl p-5"
      >
        {/* Placeholder photo — swap for a gender-based picture later. */}
        <div className="aspect-square w-24 shrink-0 rounded-3xl bg-white/10" />

        <span className="flex flex-1 items-center justify-end text-right font-semibold text-white">
          {userName}
        </span>

        {/* Placeholder avatar — swap for a gender-based picture later. */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center self-center rounded-full bg-avocado-yellow/20 text-avocado-yellow">
          <User size={24} />
        </div>
      </button>

      <AccountEditModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />

      <div className="flex gap-4">
        <button
          onClick={() => navigate("/settings/weight")}
          className="glass-panel flex-1 rounded-3xl p-4 text-center"
        >
          <p className="text-lg font-bold text-white">وزن</p>
          <p className="mt-1 text-sm text-white">
            {weight !== null ? `${toFaDigits(weight)} کیلوگرم` : "ثبت نشده"}
          </p>
        </button>

        {/* No height storage/editing exists yet — plain display card for now. */}
        <div className="glass-panel flex-1 rounded-3xl p-4 text-center">
          <p className="text-lg font-bold text-white">قد</p>
          <p className="mt-1 text-sm text-white">ثبت نشده</p>
        </div>
      </div>
    </div>
  );
}
