import { useEffect, useState } from "react";

import { dismissKeyboard, parseLocalizedNumber } from "@/native/keyboard";

export interface DecimalNumberInputProps {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

/**
 * Mobile/iOS-friendly decimal input:
 * - Uses `type="text"` + `inputMode="decimal"` so iOS Persian keyboards accept
 *   Persian digits (`۰-۹`) and `٫` without rejecting the input.
 * - Keeps an internal string draft while focused so clearing or typing `"1.5"`
 *   never snaps to `0` mid-keystroke.
 * - Dismisses the iOS keyboard cleanly on Enter.
 */
export default function DecimalNumberInput({
  value,
  onChange,
  disabled = false,
  ariaLabel,
  className = "",
}: DecimalNumberInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => String(value));

  useEffect(() => {
    if (!focused) {
      setDraft(String(value));
    }
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      enterKeyHint="done"
      disabled={disabled}
      aria-label={ariaLabel}
      value={focused ? draft : String(value)}
      onFocus={(e) => {
        setFocused(true);
        setDraft(String(value));
        e.target.select();
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = parseLocalizedNumber(draft);
        if (parsed !== null) {
          onChange(parsed);
          setDraft(String(parsed));
        } else {
          setDraft(String(value));
        }
      }}
      onChange={(e) => {
        const nextText = e.target.value;
        setDraft(nextText);
        const parsed = parseLocalizedNumber(nextText);
        if (parsed !== null) {
          onChange(parsed);
        } else if (nextText.trim() === "") {
          onChange(0);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          dismissKeyboard();
        }
      }}
      className={className}
    />
  );
}
