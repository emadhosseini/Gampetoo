import type { MouseEvent, ReactNode } from "react";

export interface ModalOverlayProps {
  onClose: () => void;
  children: ReactNode;
  // InstallHint intentionally sits below the rest (z-50, no pt-safe) so an
  // update-available prompt (z-70) always wins if both could ever show at
  // once — every other popup uses the defaults.
  zIndexClass?: string;
  paddingTop?: string;
}

// A blurred backdrop plus a centered card, kept as separate siblings rather
// than nesting the card inside the backdrop. The backdrop needs touch-action:
// none so a drag over the empty space around the card can't scroll the page
// behind it — but touch-action isn't just per-element, browsers intersect it
// across ancestors for a touch region, so a scrollable card nested inside a
// touch-none ancestor would lose its own scrolling too. Splitting them avoids
// that: the card-positioning layer is pointer-events-none (so it doesn't
// itself capture touches in the space around the card — those fall through
// to the backdrop below), and only the card re-enables pointer-events.
export default function ModalOverlay({
  onClose,
  children,
  zIndexClass = "z-[70]",
  paddingTop = "pt-safe",
}: ModalOverlayProps) {
  function stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }

  return (
    <>
      <div
        className={`fixed inset-0 ${zIndexClass} touch-none backdrop-blur-[25px]`}
        // iOS Safari has a long-standing bug where backdrop-filter on a
        // position:fixed element intermittently doesn't render at all
        // (not a positioning issue — the element is where it should be,
        // it just paints as if backdrop-filter were none). Forcing this
        // onto its own GPU compositing layer is the standard, well-known
        // mitigation.
        style={{ transform: "translateZ(0)", willChange: "backdrop-filter" }}
        onClick={onClose}
      />

      <div
        className={`${paddingTop} pointer-events-none fixed inset-0 ${zIndexClass} flex items-center justify-center px-6`}
      >
        <div
          onClick={stopPropagation}
          className="pointer-events-auto w-full max-w-sm"
        >
          {children}
        </div>
      </div>
    </>
  );
}
