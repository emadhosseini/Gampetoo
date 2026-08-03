import { useState } from "react";
import { ChevronRight, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  MAX_WATER_GOAL,
  MIN_WATER_GOAL,
  getTodayGlasses,
  getWaterGoal,
  setTodayGlasses,
  setWaterGoal,
} from "@/utils/waterEngine";
import { toFaDigits } from "@/utils/numberFormat";

const WATER_COLOR = "#38bdf8";

// No chart here, unlike the other three stat pages: a glass count is a
// small whole number you top up through the day, so the useful view is
// "how full am I right now", not a trend line. The page is built around
// a jug that fills as you log, plus a grid of glasses you tap directly.
export default function WaterDetailPage() {
  const navigate = useNavigate();
  const [glasses, setGlasses] = useState(() => getTodayGlasses());
  const [goal, setGoal] = useState(() => getWaterGoal());

  const fill = Math.min(1, goal > 0 ? glasses / goal : 0);
  const reached = glasses >= goal;

  // Jug body spans y=18 (rim) to y=88 (base) in the 100x100 viewBox.
  const waterTop = 88 - fill * 70;

  function applyCount(next: number) {
    const clamped = Math.max(0, next);

    setGlasses(clamped);
    setTodayGlasses(clamped);
  }

  // Tapping a glass fills up to it; tapping the one you're already at
  // empties it instead, so a mis-tap is undone the same way it was made.
  function handleGlassTap(index: number) {
    applyCount(index + 1 === glasses ? index : index + 1);
  }

  function applyGoal(next: number) {
    const clamped = Math.min(MAX_WATER_GOAL, Math.max(MIN_WATER_GOAL, next));

    setGoal(clamped);
    setWaterGoal(clamped);
  }

  return (
    <div className="pb-5">
      <div className="glass-panel glass-panel-flush-top glass-static rounded-b-3xl rounded-t-none px-5 pb-6 pt-safe">
        <div className="relative flex items-center justify-center pt-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="بازگشت"
            className="glass-chip absolute right-0 flex h-9 w-9 items-center justify-center rounded-full"
          >
            <ChevronRight size={18} />
          </button>

          <h1 className="text-lg font-bold text-white">آب</h1>
        </div>

        <div className="mx-auto mt-4 h-36 w-36">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <defs>
              <clipPath id="water-page-jug">
                <path d="M 26 20 L 74 20 L 66 86 L 34 86 Z" />
              </clipPath>
            </defs>

            <motion.rect
              x="18"
              width="64"
              fill={WATER_COLOR}
              fillOpacity="0.85"
              clipPath="url(#water-page-jug)"
              initial={false}
              animate={{ y: waterTop, height: 88 - waterTop }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
            />

            <path
              d="M 26 20 L 74 20 L 66 86 L 34 86 Z"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            <line
              x1="26"
              y1="20"
              x2="74"
              y2="20"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Readout below the jug rather than over it — on top, it landed
            on the waterline at exactly the fill levels people hit most,
            where white-on-light-blue stops being readable. */}
        <p className="mt-3 text-center">
          <span className="text-4xl font-bold text-white">{toFaDigits(glasses)}</span>{" "}
          <span className="text-sm text-white/70">از {toFaDigits(goal)} لیوان</span>
        </p>

        <p
          className="mt-1 text-center font-semibold"
          style={{ color: reached ? "#4ade80" : WATER_COLOR }}
        >
          {reached
            ? "آفرین، به هدف امروزت رسیدی"
            : `${toFaDigits(goal - glasses)} لیوان تا هدف امروز`}
        </p>
      </div>

      <div className="space-y-4 px-5 pt-4">
        <div className="glass-panel glass-static rounded-3xl p-5">
          <p className="text-sm text-white/60">
            روی لیوانی که خوردی بزن — دوباره زدن روی آخرین لیوان، پسش می‌گیره.
          </p>

          <div className="mt-4 grid grid-cols-4 gap-3">
            {Array.from({ length: goal }, (_, i) => {
              const filled = i < glasses;

              return (
                <motion.button
                  key={i}
                  onClick={() => handleGlassTap(i)}
                  aria-label={`${toFaDigits(i + 1)} لیوان`}
                  whileTap={{ scale: 0.88 }}
                  className="flex aspect-square items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: filled ? `${WATER_COLOR}33` : "rgba(255,255,255,0.06)",
                    boxShadow: filled ? `inset 0 0 0 1.5px ${WATER_COLOR}` : undefined,
                  }}
                >
                  <svg viewBox="0 0 100 100" className="h-3/5 w-3/5">
                    <defs>
                      <clipPath id={`glass-clip-${i}`}>
                        <path d="M 28 16 L 72 16 L 65 84 L 35 84 Z" />
                      </clipPath>
                    </defs>

                    {filled && (
                      <rect
                        x="20"
                        y="16"
                        width="60"
                        height="70"
                        fill={WATER_COLOR}
                        clipPath={`url(#glass-clip-${i})`}
                      />
                    )}

                    <path
                      d="M 28 16 L 72 16 L 65 84 L 35 84 Z"
                      fill="none"
                      stroke={filled ? "#ffffff" : "rgba(255,255,255,0.45)"}
                      strokeWidth="5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
              );
            })}
          </div>

          {/* Beyond-the-goal drinking still counts, and the grid only has
              `goal` slots — these keep the exact number reachable. */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => applyCount(glasses - 1)}
              disabled={glasses === 0}
              aria-label="یک لیوان کمتر"
              className="glass-chip flex h-11 w-11 items-center justify-center rounded-full text-white disabled:opacity-40"
            >
              <Minus size={20} />
            </button>

            <span className="min-w-16 text-center text-lg font-bold text-white">
              {toFaDigits(glasses)}
            </span>

            <button
              onClick={() => applyCount(glasses + 1)}
              aria-label="یک لیوان بیشتر"
              className="glass-chip flex h-11 w-11 items-center justify-center rounded-full text-white"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="glass-panel glass-static flex items-center justify-between rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => applyGoal(goal - 1)}
              disabled={goal <= MIN_WATER_GOAL}
              aria-label="کم کردن هدف"
              className="glass-chip flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-40"
            >
              <Minus size={16} />
            </button>

            <span className="min-w-14 text-center font-bold text-white">
              {toFaDigits(goal)} لیوان
            </span>

            <button
              onClick={() => applyGoal(goal + 1)}
              disabled={goal >= MAX_WATER_GOAL}
              aria-label="زیاد کردن هدف"
              className="glass-chip flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>

          <span className="font-semibold text-white">هدف روزانه</span>
        </div>
      </div>
    </div>
  );
}
