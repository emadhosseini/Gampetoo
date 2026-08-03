export interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

// iOS-style on/off switch. The thumb is anchored at the RTL start (right)
// edge and just translates left when on — this app never renders LTR, so
// that's hardcoded rather than computed, instead of the usual flexbox
// justify-content trick (which can't animate smoothly: repositioning via
// justify-content is a layout change, not a transform, so it snaps instead
// of sliding).
export default function Toggle({ checked, onChange, className = "" }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      // On-state used to be avocado-yellow; with every button fill in the
      // app now glass, that would have been the last yellow fill left and
      // read as a leftover. Lime is the palette's existing "affirmative"
      // colour (the day-card gradient, the meal cards' add buttons) and,
      // unlike a white track, still contrasts against the white thumb.
      className={`relative h-6 w-11 shrink-0 touch-manipulation rounded-full transition-colors duration-200 ${
        checked ? "bg-avocado-lime" : "bg-white/20"
      } ${className}`}
    >
      <span
        className={`absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? "-translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
