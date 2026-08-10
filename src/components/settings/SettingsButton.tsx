import { Settings } from "lucide-react";

export interface SettingsButtonProps {
  onClick: () => void;
}

// Meant to live in the app's side menu (SideMenu.tsx) — a plain glass
// icon button, same size/shape as every other icon-only button in this
// app (e.g. WorkoutHeader's forgot/edit buttons), just with a gear glyph.
export default function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="تنظیمات"
      className="glass-chip glass-static flex h-10 w-10 items-center justify-center rounded-full text-white"
    >
      <Settings size={18} />
    </button>
  );
}
