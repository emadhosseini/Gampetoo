import { useState } from "react";
import { Droplet, Pencil } from "lucide-react";

import WaterLogModal from "@/components/WaterLogModal";
import WaterGoalModal from "@/components/progress/WaterGoalModal";
import { getTodayGlasses, getWaterGoal, logGlasses } from "@/utils/waterEngine";
import { toFaDigits } from "@/utils/numberFormat";

const BAR_COLOR = "#38bdf8";

// Mirrors ProteinProgressRow's layout, but the whole row is itself the
// entry point for logging water (same modal/behavior as the bottom-nav
// shortcut's "افزودن آب" action), plus a pencil button for the daily goal
// next to the "هدف: X لیوان" figure at the bottom, not beside the "X لیوان
// مانده" figure at the top.
//
// The row is a plain div with onClick (not a <button>) rather than the
// naive approach, specifically so the pencil <button> can sit inline
// inside it without an invalid button-in-button.
export default function WaterProgressRow() {
  const [addOpen, setAddOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  // getTodayGlasses/getWaterGoal read straight from localStorage — this is
  // what actually picks up a fresh value after logging water or saving a
  // new goal, since nothing else here re-renders on its own. This card
  // lives entirely on ProgressPage, so a local rerender is enough — no
  // navigation needed to reflect a change.
  const [, forceRerender] = useState(0);

  const glasses = getTodayGlasses();
  const goal = getWaterGoal();

  const barFraction = Math.min(1, goal > 0 ? glasses / goal : 0);
  const remainingGlasses = Math.max(0, goal - glasses);

  return (
    <>
      {/* Modals are portaled to document.body by ModalOverlay, but React
          still bubbles their synthetic events up through this component
          tree (not the DOM tree) — nested here, a tap inside either modal
          would also fire this row's own onClick. Kept as siblings instead
          so that can't happen. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setAddOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setAddOpen(true);
        }}
        className="flex cursor-pointer flex-col gap-2 text-right"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet size={18} className="text-white/70" />
            <span className="text-sm font-semibold text-white">آب</span>
          </div>

          <span className="text-sm font-bold" style={{ color: BAR_COLOR }}>
            {toFaDigits(remainingGlasses)} لیوان مانده
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${barFraction * 100}%`, backgroundColor: BAR_COLOR }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-white/50">
          <span>دریافت شده: {toFaDigits(glasses)} لیوان</span>

          <span className="flex items-center gap-2">
            هدف: {toFaDigits(goal)} لیوان
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGoalOpen(true);
              }}
              aria-label="تغییر هدف روزانه آب"
              className="glass-chip shrink-0 rounded-full p-1 text-white/70"
            >
              <Pencil size={12} />
            </button>
          </span>
        </div>
      </div>

      <WaterLogModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onLog={(count) => {
          logGlasses(count);
          forceRerender((n) => n + 1);
        }}
      />

      <WaterGoalModal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        onSaved={() => {
          setGoalOpen(false);
          forceRerender((n) => n + 1);
        }}
      />
    </>
  );
}
