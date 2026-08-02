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
      className={`relative h-6 w-11 shrink-0 touch-manipulation rounded-full transition-colors duration-200 ${
        checked ? "bg-avocado-yellow" : "bg-white/20"
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
