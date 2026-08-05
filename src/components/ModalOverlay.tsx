import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Module-level, not component state: more than one ModalOverlay can be
// mounted at the same moment in edge cases (one closing while another
// opens), and only the last one to unmount should actually restore
// scrolling. Locking always sets the same fixed values rather than saving
// whatever was there before — unlocking removes the inline override
// entirely, which already falls back correctly to #app-scroll-root's own
// overflow-y-auto class (see Layout.tsx).
let openOverlayCount = 0;

function lockBackgroundScroll() {
  openOverlayCount += 1;
  if (openOverlayCount > 1) return;

  document.body.style.overflow = "hidden";

  // Deliberately NOT touch-action: none on <body>. Popups are portaled into
  // it, so body is an ancestor of every field the app has — and browsers
  // intersect touch-action across the whole ancestor chain for a touch
  // region, not per element. Setting it here therefore reached inside the
  // popups too and killed the long-press that raises iOS's own
  // select/paste menu: there was no way to paste into any input in this
  // app, the AI meal description worst of all, since dictating a meal into
  // notes and pasting it is exactly how you'd use that field.
  //
  // Nothing is lost by dropping it. The scroll root below is the element
  // that actually scrolls, and it keeps both properties; the backdrop
  // covers the viewport with its own touch-none; and overflow: hidden here
  // still pins the page.
  const scrollRoot = document.getElementById("app-scroll-root");
  if (scrollRoot) {
    scrollRoot.style.overflow = "hidden";
    scrollRoot.style.touchAction = "none";
  }
}

function unlockBackgroundScroll() {
  openOverlayCount = Math.max(0, openOverlayCount - 1);
  if (openOverlayCount > 0) return;

  document.body.style.removeProperty("overflow");
  // Still cleared even though locking no longer sets it, so a device that
  // has one left over from a previous version isn't stuck with it.
  document.body.style.removeProperty("touch-action");

  const scrollRoot = document.getElementById("app-scroll-root");
  if (scrollRoot) {
    scrollRoot.style.removeProperty("overflow");
    scrollRoot.style.removeProperty("touch-action");
  }
}

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

  // Every popup in the app is built on this component, so locking scroll
  // here covers all of them at once. Without this, a touch-drag starting
  // over the backdrop (the empty space around the card — nothing below it
  // blocks the gesture) could scroll the page behind it, and a drag that
  // starts on the card's own scrollable content and runs past its
  // top/bottom edge chains into scrolling that same page underneath,
  // fighting the popup for the gesture. `<main>` (Layout's
  // #app-scroll-root) is the actual scrolling element — MobileContainer
  // itself doesn't scroll — so that's what needs locking, not
  // document.body.
  useEffect(() => {
    lockBackgroundScroll();
    return unlockBackgroundScroll;
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
