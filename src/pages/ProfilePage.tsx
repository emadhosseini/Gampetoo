import { useState } from "react";
import { ChevronLeft, Mars, User, Venus } from "lucide-react";

import AccountEditModal from "@/components/AccountEditModal";
import BmiCard from "@/components/BmiCard";
import WeightModal from "@/components/WeightModal";
import HeightModal from "@/components/HeightModal";
import {
  getCurrentUserGender,
  getCurrentUserHeight,
  getCurrentUserName,
} from "@/utils/userEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

export default function ProfilePage() {
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [heightModalOpen, setHeightModalOpen] = useState(false);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [, setVersion] = useState(0);

  const userName = getCurrentUserName() ?? "";
  const gender = getCurrentUserGender();
  const weight = getLatestWeight();
  const height = getCurrentUserHeight();

  const GenderIcon = gender === "male" ? Mars : gender === "female" ? Venus : User;

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <h1 className="text-center text-2xl font-bold text-white">
        حساب کاربری
      </h1>

      <button
        onClick={() => setAccountModalOpen(true)}
        className="glass-panel flex w-full items-center justify-between rounded-3xl p-5"
      >
        <div className="flex items-center gap-4">
          {/* Gender-based avatar icon, chosen once the user picks a gender
              in the account-edit popup — a generic person icon until then. */}
          <div className="flex aspect-square w-24 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-avocado-yellow">
            <GenderIcon size={40} />
          </div>

          <span className="font-semibold text-white">{userName}</span>
        </div>

        <div
          aria-hidden="true"
          className="glass-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl"
        >
          <ChevronLeft size={20} />
        </div>
      </button>

      <AccountEditModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />

      <div className="flex gap-4">
        <button
          onClick={() => setWeightModalOpen(true)}
          className="glass-panel flex-1 rounded-3xl p-4 text-center"
        >
          <p className="text-lg font-bold text-white">وزن</p>
          <p className="mt-1 text-sm text-white">
            {weight !== null ? `${toFaDigits(weight)} کیلوگرم` : "ثبت نشده"}
          </p>
        </button>

        <button
          onClick={() => setHeightModalOpen(true)}
          className="glass-panel flex-1 rounded-3xl p-4 text-center"
        >
          <p className="text-lg font-bold text-white">قد</p>
          <p className="mt-1 text-sm text-white">
            {height !== null ? `${toFaDigits(height)} سانتی‌متر` : "ثبت نشده"}
          </p>
        </button>
      </div>

      <BmiCard />

      <WeightModal
        open={weightModalOpen}
        onClose={() => setWeightModalOpen(false)}
        onSaved={() => setVersion((v) => v + 1)}
      />

      <HeightModal
        open={heightModalOpen}
        onClose={() => setHeightModalOpen(false)}
        onSaved={() => setVersion((v) => v + 1)}
      />
    </div>
  );
}
