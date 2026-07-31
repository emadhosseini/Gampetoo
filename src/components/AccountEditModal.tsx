import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getCurrentUserGender,
  getCurrentUserName,
  logoutCurrentUser,
  setCurrentUserGender,
  setCurrentUserName,
  type Gender,
} from "@/utils/userEngine";
import { resetApplication } from "@/domain/reset/resetApplication";
import { signOutRemote } from "@/auth/authEngine";

export interface AccountEditModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AccountEditModal({
  open,
  onClose,
}: AccountEditModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(() => getCurrentUserName() ?? "");
  const [gender, setGender] = useState<Gender | null>(() =>
    getCurrentUserGender(),
  );

  if (!open) {
    return null;
  }

  function handleSave() {
    const trimmed = name.trim();

    if (trimmed) {
      setCurrentUserName(trimmed);
    }

    if (gender) {
      setCurrentUserGender(gender);
    }

    onClose();
  }

  function handleLogout() {
    const confirmed = window.confirm(
      "از حساب کاربریت خارج می‌شی و به صفحه اول برمی‌گردی. اطلاعات و تنظیمات این حساب پاک نمی‌شه و هر وقت دوباره با همین نام کاربری وارد بشی، همه‌چیز برمی‌گرده.\n\nادامه می‌دی؟",
    );

    if (!confirmed) {
      return;
    }

    void signOutRemote();
    logoutCurrentUser();

    navigate("/setup", { replace: true });
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "تمام اطلاعات برنامه، جلسات ثبت‌شده و پیشرفت شما حذف می‌شود و امکان بازگردانی وجود ندارد.\n\nآیا مطمئن هستید؟",
    );

    if (!confirmed) {
      return;
    }

    await resetApplication();

    navigate("/setup", { replace: true });
  }

  return (
    <div
      className="pt-safe fixed inset-0 z-[70] flex items-center justify-center px-6 backdrop-blur-[18px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-forest-600 bg-forest-700 p-6 shadow-2xl"
      >
        <h2 className="text-center text-lg font-bold text-white">
          حساب کاربری
        </h2>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم خودتو وارد کن"
          className="glass-chip w-full rounded-xl p-4 text-center text-white"
        />

        <div className="flex gap-3">
          <button
            onClick={() => setGender("male")}
            className={`glass-tap flex-1 rounded-xl py-4 font-bold transition-colors ${
              gender === "male"
                ? "bg-avocado-yellow text-black"
                : "selector-pill text-white"
            }`}
          >
            مرد
          </button>

          <button
            onClick={() => setGender("female")}
            className={`glass-tap flex-1 rounded-xl py-4 font-bold transition-colors ${
              gender === "female"
                ? "bg-avocado-yellow text-black"
                : "selector-pill text-white"
            }`}
          >
            زن
          </button>
        </div>

        <button
          onClick={handleSave}
          className="glass-tap w-full rounded-2xl bg-avocado-yellow py-4 text-lg font-bold text-black"
        >
          ذخیره
        </button>

        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            onClick={handleLogout}
            className="glass-tap rounded-full border border-forest-500 px-5 py-2 text-sm text-white"
          >
            خروج از حساب کاربری
          </button>

          <button
            onClick={() => void handleDeleteAccount()}
            className="text-xs text-white/60"
          >
            پاک کردن حساب کاربری
          </button>
        </div>
      </div>
    </div>
  );
}
