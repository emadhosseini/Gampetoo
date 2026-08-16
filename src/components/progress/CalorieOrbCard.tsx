import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

import {
  getCalorieTarget,
  getTodaysTotalCalories,
} from "@/utils/dailyLogEngine";
import { getTodayActivityCalories } from "@/utils/activityLogEngine";
import { getTodayWorkoutCalories } from "@/utils/workoutCalorieEngine";
import { calculateProteinTarget, getCalorieGoal } from "@/utils/calorieEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";
import CalorieGoalChoiceModal from "@/components/progress/CalorieGoalChoiceModal";
import CalorieGoalModal from "@/components/progress/CalorieGoalModal";
import CalorieGoalSummaryModal from "@/components/progress/CalorieGoalSummaryModal";
import TargetCaloriesModal from "@/components/progress/TargetCaloriesModal";

// null = nothing open. "summary" (target already set) and "choice" (no
// target yet) are the two possible entry points from tapping the
// "باقیمانده" card — summary's own "تغییر" button also lands on "choice".
type GoalScreen = "summary" | "choice" | "manual" | "calculate" | null;

// Fixed meanings, not status zones: green is always "باقیمانده", yellow
// always "دریافتی", red always "سوزانده‌شده" — these three colors are what
// the circle is drawn out of (see below), so the numbers beside it have to
// use the exact same three, not a status-dependent palette that would make
// the two disagree.
const REMAINING_COLOR = "#4ade80";
const CONSUMED_COLOR = "#faea5c";
const BURNED_COLOR = "#f87171";

const WAVE_AMPLITUDE = 1.6;
const WAVE_LENGTH = 36;
const WAVE_SAMPLES = 20;

// Five keyframes spanning exactly one full period: sin is periodic in
// `phase` with period WAVE_LENGTH by construction, so the last keyframe is
// pointwise identical to the first — framer-motion animating through them
// on loop is a seamless traveling wave, not a snap back to start.
const WAVE_PHASES = [0, 0.25, 0.5, 0.75, 1].map((t) => t * WAVE_LENGTH);

function waveOffset(x: number, phase: number): number {
  return WAVE_AMPLITUDE * Math.sin(((x + phase) / WAVE_LENGTH) * 2 * Math.PI);
}

function waveSamplePoints(baseY: number, phase: number) {
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= WAVE_SAMPLES; i++) {
    const x = (i / WAVE_SAMPLES) * 100;

    points.push({ x, y: baseY + waveOffset(x, phase) });
  }

  return points;
}

// An open polyline tracing just the wavy surface — used for the thin
// highlight riding on top of the real liquid edge below. Not a closed
// shape, so it's stroke-only, not fill-able.
function waveLine(baseY: number, phase: number): string {
  const pts = waveSamplePoints(baseY, phase).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);

  return `M${pts.join(" L")}`;
}

// The filled liquid body from its wavy top down past the bottom of the
// viewBox (the clip circle hides everything below the visible glass, so
// the straight bottom edge this closes with is never actually seen).
function liquidBodyPath(topY: number, phase: number): string {
  const top = waveSamplePoints(topY, phase).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);

  return `M${top.join(" L")} L100,100 L0,100 Z`;
}

// A band between two wavy edges that share the same phase — the reason
// this doesn't reduce to the same bug the ripple had. Because top and
// bottom use one identical wave function, they're parallel at every x: the
// band's height is (topY - bottomY) everywhere, never varying by position,
// and collapses to a real, uniform zero — not a jittering sliver — when
// topY equals bottomY. An independent phase per edge was tried first and
// rejected: at the moment the red band should vanish (nothing burned yet),
// two differently-phased curves at the same baseline don't cancel out,
// they cross, leaving alternating slivers of red flickering in from
// nowhere.
function bandPath(topY: number, bottomY: number, phase: number): string {
  const top = waveSamplePoints(topY, phase).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  const bottom = waveSamplePoints(bottomY, phase)
    .reverse()
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);

  return `M${top.join(" L")} L${bottom.join(" L")} Z`;
}

// Fixed x positions and per-bubble timing rather than Math.random(): stable
// across re-renders (nothing jumps around when the page updates for an
// unrelated reason), while still reading as organic since no two bubbles
// share a size, speed or start time.
const BUBBLES = [
  { x: 28, r: 1.6, duration: 2.8, delay: 0 },
  { x: 47, r: 1.1, duration: 2.2, delay: 0.7 },
  { x: 65, r: 1.8, duration: 3.1, delay: 1.4 },
  { x: 78, r: 1.2, duration: 2.5, delay: 0.3 },
];

export interface CalorieOrbCardProps {
  // Saving a calorie goal here also changes what the rows BESIDE this card
  // show — the protein target is computed from the same goal and weight,
  // and the calculate flow records a weigh-in. Those are siblings, so this
  // card's own re-render can't reach them; the parent has to be told.
  onGoalSaved?: () => void;
}

export default function CalorieOrbCard({ onGoalSaved }: CalorieOrbCardProps = {}) {
  const clipId = useId();
  const navigate = useNavigate();

  const [goalScreen, setGoalScreen] = useState<GoalScreen>(null);
  // getCalorieTarget/getCalorieGoal read straight from localStorage —
  // bumping this after a save is what picks up the fresh number here (the
  // orb, remaining figure, etc.) without a full page reload.
  const [, forceRerender] = useState(0);

  const target = getCalorieTarget();
  const consumed = getTodaysTotalCalories();
  const burned = getTodayWorkoutCalories() + getTodayActivityCalories();
  const remaining = target !== null ? target - consumed + burned : null;

  const weight = getLatestWeight();
  const proteinTarget =
    weight !== null
      ? calculateProteinTarget(weight, getCalorieGoal() ?? "maintain").grams
      : null;

  function openGoalFlow() {
    setGoalScreen(target !== null ? "summary" : "choice");
  }

  function handleGoalSaved() {
    setGoalScreen(null);
    forceRerender((n) => n + 1);
    onGoalSaved?.();
  }

  // Three regions stacked bottom-to-top inside the glass, each the exact
  // color of the number it belongs to:
  //   yellow  0 -> netTop        (consumed, net of what exercise gave back)
  //   red     netTop -> eatenTop (the slice exercise reclaimed — only as
  //                                tall as there was something to reclaim)
  //   green   eatenTop -> rim    (what's left)
  // burned can only reclaim height that was actually filled, and every
  // fraction is independently clamped to [0,1] before the subtraction, so
  // netTop <= eatenTop always holds and the red band can't go negative.
  const eatenTop =
    target !== null && target > 0 ? Math.min(Math.max(consumed / target, 0), 1) : 0;
  const netTop =
    target !== null && target > 0
      ? Math.min(Math.max((consumed - burned) / target, 0), 1)
      : 0;

  const eatenTopY = 100 - eatenTop * 100;
  const netTopY = 100 - netTop * 100;

  // The whole liquid body's silhouette (yellow's true outline, since red is
  // just an overlay carved out of its upper portion) and the red overlay
  // band, at each of the five loop keyframes — one shared phase per
  // keyframe index for both, which is exactly what keeps the red band's
  // edges parallel to each other. See bandPath's comment for why that
  // matters.
  const bodyKeyframes = WAVE_PHASES.map((phase) => liquidBodyPath(eatenTopY, phase));
  const bandKeyframes = WAVE_PHASES.map((phase) => bandPath(eatenTopY, netTopY, phase));
  const highlightKeyframes = WAVE_PHASES.map((phase) => waveLine(eatenTopY, phase));

  return (
    <>
    <div className="relative flex h-full min-h-0 items-center gap-3">
      {/* Weekly/monthly trend of the same "باقیمانده" figure — pinned to the
          whole card's own top-left corner (empty space above the circle),
          not inside any one chip, so it never crowds their text. */}
      {target !== null && (
        <button
          onClick={() => navigate("/progress/calorie-budget")}
          aria-label="روند کالری مجاز هفتگی و ماهیانه"
          className="glass-chip glass-static absolute left-0 top-0 z-10 flex h-7 w-7 items-center justify-center rounded-full"
          style={{ color: REMAINING_COLOR }}
        >
          <TrendingUp size={14} />
        </button>
      )}

      {/* Every number the circle is made of, on the right where reading
          starts — colored to match the region inside it exactly, and
          باقیمانده set larger since it's the one figure someone opens this
          card to check first. Each is its own tappable card now: باقیمانده
          opens the goal summary/edit flow, دریافتی goes to کالری روزانه's
          own chart page, سوزانده‌شده goes to فعالیت روزانه's. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
        {target === null ? (
          <button
            onClick={openGoalFlow}
            className="glass-chip glass-static rounded-2xl p-2.5 text-right"
          >
            <p className="text-xs leading-5 text-white/50">
              کالری هدف رو ثبت کن تا این بخش کار کنه
            </p>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={openGoalFlow}
              className="glass-chip glass-static rounded-2xl p-2.5 text-right"
            >
              <p
                className="text-sm font-bold leading-snug"
                style={{ color: REMAINING_COLOR }}
              >
                باقیمانده کالری مجاز امروز:
              </p>
              <p
                className="text-2xl font-extrabold leading-tight"
                style={{ color: REMAINING_COLOR }}
              >
                {toFaDigits(remaining!)}{" "}
                <span className="text-sm font-normal opacity-80">کالری</span>
              </p>
            </button>

            <button
              onClick={() => navigate("/progress/calories")}
              className="glass-chip glass-static rounded-2xl p-2.5 text-right"
            >
              <p
                className="text-xs font-semibold"
                style={{ color: CONSUMED_COLOR }}
              >
                کالری دریافتی امروز:
              </p>
              <p
                className="text-base font-bold leading-tight"
                style={{ color: CONSUMED_COLOR }}
              >
                {toFaDigits(consumed)}{" "}
                <span className="text-xs font-normal opacity-80">کالری</span>
              </p>
            </button>

            <button
              onClick={() => navigate("/progress/activity")}
              className="glass-chip glass-static rounded-2xl p-2.5 text-right"
            >
              <p className="text-xs font-semibold" style={{ color: BURNED_COLOR }}>
                کالری سوزانده شده امروز:
              </p>
              <p
                className="text-base font-bold leading-tight"
                style={{ color: BURNED_COLOR }}
              >
                {toFaDigits(burned)}{" "}
                <span className="text-xs font-normal opacity-80">کالری</span>
              </p>
            </button>
          </div>
        )}
      </div>

      {/* The circle sits exactly in this half, centered in it. Sized to a
          fixed height rather than filling the half (which was the actual
          complaint — sized off 100% of the row, it came out taller than
          the three-line text block beside it, so the two didn't line up
          top and bottom). The text block's rendered height is a known,
          fixed quantity — three lines at fixed font sizes, not something
          that reflows unpredictably — so a fixed circle height that
          matches it is a real answer here, not a rough guess: adding up
          each line's font-size × line-height plus the gaps between them
          (leading-snug/leading-tight are explicit on the bigger lines,
          Tailwind's own defaults apply to the rest) comes to ~141px, which
          is what h-36 is.
          justify-end, not justify-center: this wrapper is the card's left
          half, and centering the circle within just that half left a gap
          between the circle's left edge and the card's actual left edge —
          not flush with the protein row's own left-aligned figures below
          it. justify-end is CSS's direction-aware "end", which in this
          RTL app is the left edge, so this pushes the circle there
          instead of splitting the gap on both sides. */}
      <div className="flex h-full min-h-0 flex-1 items-center justify-end">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <defs>
              <clipPath id={clipId}>
                <circle cx="50" cy="50" r="47" />
              </clipPath>
            </defs>

            <circle
              cx="50"
              cy="50"
              r="47"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.5"
            />

            {target !== null && (
              <g clipPath={`url(#${clipId})`}>
                {/* Green base first, full circle — it's what's left when
                    nothing above it has claimed the space yet, so drawing
                    it as the default rather than a separately-animated
                    region is both simpler and correct: whatever the liquid
                    below doesn't cover already reads as remaining. */}
                <rect x="0" y="0" width="100" height="100" fill={REMAINING_COLOR} fillOpacity="0.85" />

                {/* The liquid itself — yellow, with a genuinely wavy top
                    edge rather than a flat rect decorated with a wave
                    drawn over it. That was the previous version's actual
                    bug: the decoration didn't cover the rectangle's real
                    straight edge, so the flat line still showed through
                    wherever the ripple curved above it. Now the fill's own
                    outline is the wave, so there's no straight edge left
                    to show through in the first place. initial={false} so
                    opening the page doesn't replay a fill-from-empty
                    animation — only a real change while mounted moves it. */}
                <motion.path
                  d={bodyKeyframes[0]}
                  fill={CONSUMED_COLOR}
                  fillOpacity="0.9"
                  initial={false}
                  animate={{ d: bodyKeyframes }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
                />

                {/* Red overlay — the reclaimed slice, carved out of the
                    yellow body's upper portion using the same shared phase
                    as the body's own top, so its lower edge is always
                    exactly flush with the yellow beneath it. */}
                <motion.path
                  d={bandKeyframes[0]}
                  fill={BURNED_COLOR}
                  fillOpacity="0.85"
                  initial={false}
                  animate={{ d: bandKeyframes }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
                />

                {/* A thin bright line riding exactly along the same curve
                    as the fill's own top edge — purely a highlight/glint,
                    not a second source of shape, which is what keeps it
                    from ever drifting out of alignment with what's under
                    it. */}
                {eatenTop > 0 && (
                  <motion.path
                    d={highlightKeyframes[0]}
                    fill="none"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                    strokeLinecap="round"
                    initial={false}
                    animate={{ d: highlightKeyframes }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
                  />
                )}

                {/* Gated on an actual depth of liquid, not just netTop>0:
                    close to the bottom, "3 units above the surface" can
                    land at or past the 99-unit starting point, so a bubble
                    would sink instead of rise. The clamp on the target is
                    a second, independent guarantee of the same thing — it
                    holds even if the gate's threshold is ever tuned. */}
                {netTop > 0.08 &&
                  BUBBLES.map((bubble) => (
                    <motion.circle
                      key={bubble.x}
                      cx={bubble.x}
                      r={bubble.r}
                      fill="rgba(255,255,255,0.4)"
                      initial={false}
                      animate={{
                        cy: [99, Math.min(100 - netTop * 100 + 3, 95)],
                        opacity: [0, 0.6, 0],
                      }}
                      transition={{
                        duration: bubble.duration,
                        delay: bubble.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
              </g>
            )}

            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
    </div>

    {/* Siblings of the row above, not nested inside it — ModalOverlay
        portals to document.body, but React still bubbles a click inside
        the portal up through this component tree, so nesting these would
        also fire one of the three buttons above. */}
    <CalorieGoalSummaryModal
      open={goalScreen === "summary"}
      onClose={() => setGoalScreen(null)}
      onChange={() => setGoalScreen("choice")}
      calorieTarget={target ?? 0}
      proteinGrams={proteinTarget}
    />

    <CalorieGoalChoiceModal
      open={goalScreen === "choice"}
      onClose={() => setGoalScreen(null)}
      onManual={() => setGoalScreen("manual")}
      onCalculate={() => setGoalScreen("calculate")}
    />

    <TargetCaloriesModal
      open={goalScreen === "manual"}
      onClose={() => setGoalScreen(null)}
      onSaved={handleGoalSaved}
    />

    <CalorieGoalModal
      open={goalScreen === "calculate"}
      onClose={() => setGoalScreen(null)}
      onSaved={handleGoalSaved}
    />
    </>
  );
}
