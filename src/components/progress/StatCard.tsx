import type { ReactNode } from "react";

export interface StatCardProps {
  title: string;
  goalLabel?: string;
  icon: ReactNode;
  value: string;
  onClick?: () => void;
}

// The gauge ring stays a plain, unfilled circle — there's no goal value to
// measure progress against yet, so a partially-filled ring would just be
// fabricated. It's a placeholder for once a real goal/progress feature
// exists.
export default function StatCard({
  title,
  goalLabel = "بدون هدف",
  icon,
  value,
  onClick,
}: StatCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="glass-panel w-full rounded-2xl p-5 text-right disabled:cursor-default"
    >
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="text-sm text-white/60">{goalLabel}</p>

      <div className="mt-3 border-t border-white/10 pt-3" />

      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-white">{value}</span>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white/15 text-2xl">
          {icon}
        </div>
      </div>
    </button>
  );
}
