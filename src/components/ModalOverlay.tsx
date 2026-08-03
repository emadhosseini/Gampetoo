import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

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
//
// Rendered through a portal to document.body, NOT in place. In place, every
// popup sat inside SideMenu's motion.div — and whether framer-motion leaves
// a transform on that wrapper at any given moment is timing-dependent. On
// WebKit, a transformed ancestor changes what backdrop-filter is allowed to
// sample, so the backdrop blur worked or silently didn't depending on which
// state the wrapper happened to be in — the maddening "sometimes blurred,
// sometimes not" popups on iOS. At body level there is no transformed
// ancestor, ever.
export default function ModalOverlay({
  onClose,
  children,
  zIndexClass = "z-[70]",
  paddingTop = "pt-safe",
}: ModalOverlayProps) {
  // WebKit can also fail to paint a backdrop-filter that is already present
  // on an element at DOM-insertion time — it sticks unblurred until some
  // later repaint. Mounting with blur(0) and switching it on a couple of
  // frames later makes WebKit build the backdrop layer via a property
  // *change*, which it handles reliably; the short transition doubles as a
  // pleasant fade-in.
  const [blurOn, setBlurOn] = useState(false);

  useEffect(() => {
    let raf2 = 0;

    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setBlurOn(true));
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  function stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }

  const blur = blurOn ? "blur(25px)" : "blur(0px)";

  return createPortal(
    <>
      <div
        className={`fixed inset-0 ${zIndexClass} touch-none`}
        // translateZ(0)/will-change force a GPU compositing layer — the
        // long-standing mitigation for iOS Safari intermittently not
        // rendering backdrop-filter on position:fixed elements at all. The
        // -webkit- prefixed property is set explicitly since not every
        // WebKit version honors the unprefixed one.
        style={{
          transform: "translateZ(0)",
          willChange: "backdrop-filter",
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
          transition:
            "backdrop-filter 250ms ease, -webkit-backdrop-filter 250ms ease",
        }}
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
    </>,
    document.body,
  );
}
