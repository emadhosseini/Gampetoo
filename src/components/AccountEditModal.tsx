import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ModalOverlay from "@/components/ModalOverlay";
import {
  getCurrentUserGender,
  getCurrentUserName,
  logoutCurrentUser,
  setCurrentUserGender,
  setCurrentUserName,
  type Gender,
} from "@/utils/userEngine";
import { deleteAccount } from "@/domain/reset/resetApplication";
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
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      "حساب کاربریت به‌کلی حذف می‌شه: تمام اطلاعات برنامه، جلسات ثبت‌شده و پیشرفتت، هم روی این دستگاه و هم روی سرور. نام کاربریت هم آزاد می‌شه. امکان بازگردانی وجود نداره.\n\nمطمئنی؟",
    );

    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setDeleting(true);

    const result = await deleteAccount();

    // Only navigate on a real deletion. Leaving the modal open with the
    // reason is the honest outcome when the server said no — the account is
    // still there, untouched.
    if (!result.ok) {
      setDeleting(false);
      setDeleteError(result.error ?? "حذف حساب انجام نشد.");
      return;
    }

    navigate("/setup", { replace: true });
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6">
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
                ? "glass-selected text-white"
                : "glass-chip text-white"
            }`}
          >
            مرد
          </button>

          <button
            onClick={() => setGender("female")}
            className={`glass-tap flex-1 rounded-xl py-4 font-bold transition-colors ${
              gender === "female"
                ? "glass-selected text-white"
                : "glass-chip text-white"
            }`}
          >
            زن
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full glass-action rounded-2xl py-4 text-lg font-bold text-white"
        >
          ذخیره
        </button>

        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            onClick={handleLogout}
            className="ghost-action rounded-full px-5 py-2 text-sm text-white"
          >
            خروج از حساب کاربری
          </button>

          {/* Red because it's the one irreversible action in here — it
              shouldn't read like the neutral secondary text it sat next to. */}
          <button
            onClick={() => void handleDeleteAccount()}
            disabled={deleting}
            className="text-xs font-semibold text-red-400 disabled:opacity-50"
          >
            {deleting ? "در حال حذف…" : "پاک کردن حساب کاربری"}
          </button>

          {deleteError && (
            <p className="text-center text-xs text-red-400">{deleteError}</p>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}
