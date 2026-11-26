import { useEffect, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";

import { toEnDigits } from "@/domain/nutrition/mealTextParser";
import { isNativeApp, isNativeIos } from "./platform";

/**
 * Parses a decimal number typed on either a Persian, Arabic, or English mobile
 * keyboard (`۱٫۵`, `1,5`, `1.5`, `150`). Returns `null` when blank or invalid.
 */
export function parseLocalizedNumber(raw: string): number | null {
  const normalized = toEnDigits(raw.trim()).replace(/[٫,]/g, ".");
  if (!normalized || normalized === ".") return null;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Blurs the currently focused text/number field and asks Capacitor's native
 * Keyboard plugin to dismiss the iOS keyboard immediately.
 */
export function dismissKeyboard(): void {
  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement
  ) {
    active.blur();
  }

  if (isNativeApp()) {
    void Keyboard.hide().catch(() => {});
  }
}

/**
 * Tracks the visible software keyboard height (in CSS px) while a modal or
 * form is mounted on iOS, using Capacitor's native keyboard lifecycle events
 * plus a `visualViewport` fallback.
 */
export function useKeyboardHeight(enabled = true): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setHeight(0);
      return;
    }

    let cancelled = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];

    if (isNativeIos()) {
      void Keyboard.addListener("keyboardWillShow", (info) => {
        if (!cancelled) setHeight(Math.max(0, info.keyboardHeight));
      })
        .then((h) => {
          if (cancelled) void h.remove();
          else handles.push(h);
        })
        .catch(() => {});

      void Keyboard.addListener("keyboardDidShow", (info) => {
        if (!cancelled) setHeight(Math.max(0, info.keyboardHeight));
      })
        .then((h) => {
          if (cancelled) void h.remove();
          else handles.push(h);
        })
        .catch(() => {});

      void Keyboard.addListener("keyboardWillHide", () => {
        if (!cancelled) setHeight(0);
      })
        .then((h) => {
          if (cancelled) void h.remove();
          else handles.push(h);
        })
        .catch(() => {});

      void Keyboard.addListener("keyboardDidHide", () => {
        if (!cancelled) setHeight(0);
      })
        .then((h) => {
          if (cancelled) void h.remove();
          else handles.push(h);
        })
        .catch(() => {});
    }

    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    function syncVisualViewport() {
      if (!vv || cancelled) return;
      const diff = Math.round(window.innerHeight - vv.height - vv.offsetTop);
      // Only adopt large viewport shrinks (>100px) so URL bar/safe-area jitter
      // doesn't look like an open keyboard.
      setHeight((prev) => {
        if (diff > 100) return Math.max(prev, diff);
        return isNativeIos() ? prev : 0;
      });
    }

    vv?.addEventListener("resize", syncVisualViewport);

    return () => {
      cancelled = true;
      vv?.removeEventListener("resize", syncVisualViewport);
      for (const h of handles) {
        void h.remove().catch(() => {});
      }
    };
  }, [enabled]);

  return height;
}
