import CalorieOrbCard from "@/components/progress/CalorieOrbCard";
import ProteinProgressRow from "@/components/progress/ProteinProgressRow";

// A big card below the four stat tiles. "Exactly 4x" those: they sit two
// per row in a 2-column grid, so this card is already 2x their width just
// by spanning full width. Area scales with the square of linear size, so
// matching that with 2x the height too (not 2x the area) is what actually
// makes the area come out 4x rather than 2x. h-96 approximates a tile's own
// rendered height (icon + label + padding, close to 190px) doubled.
//
// Not a button — nothing on it is tappable — so .glass-static keeps it
// from scaling on tap the way the tiles above (real buttons) do.
export default function TodayDashboardCard() {
  return (
    <div className="glass-panel glass-static flex h-96 w-full flex-col overflow-hidden rounded-2xl p-4">
      <h2 className="shrink-0 text-center text-sm font-semibold text-white/70">
        داشبورد امروز
      </h2>

      {/* min-h-0 here is load-bearing, not decorative: a flex column's
          children default to min-height:auto, meaning they refuse to
          shrink below their own content's natural size — so the orb below
          (whose circle asks for h-full) would force this wrapper taller
          than the card actually is instead of being constrained by it,
          and the whole card would grow past h-96 and spill out from under
          its own rounded corners exactly like that. min-h-0 overrides the
          default so flex-grow's arithmetic is what decides the height,
          not the content. The two sections inside need the same override
          for the same reason, one level down. */}
      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <div className="h-[60%] min-h-0 overflow-hidden">
          <CalorieOrbCard />
        </div>

        <div className="h-[40%] min-h-0 overflow-hidden border-t border-white/10 pt-3">
          <ProteinProgressRow />
        </div>
      </div>
    </div>
  );
}
