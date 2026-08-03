import { useEffect, useState } from "react";

import MeshGradientBackground from "@/components/background/MeshGradientBackground";

type MobileContainerProps = {
  children: React.ReactNode;
  // When true, the content wrapper bleeds up into the reserved safe-area
  // strip (see .bleed-top-safe) so a page with its own full-bleed top
  // panel (StatChartPage) can paint that panel's background flush to the
  // real top of the screen instead of showing this container's plain
  // background above it. Every other page leaves this off and keeps
  // relying on this container's own pt-safe as before.
  bleedTop?: boolean;
};

/* On an iOS home-screen-installed (standalone) PWA, window.innerHeight
   (and 100dvh) can report a too-short value — on cold launch, and again
   after the keyboard closes — and WebKit doesn't reliably fire any event
   when it later corrects itself, which shows up as a dead black strip
   under the app. Two defenses, because timers alone proved not to be
   enough:
   1. Re-measure on every signal available: staggered timers, resize,
      orientationchange, pageshow, and visualViewport resize (the keyboard
      closing often only announces itself there, not on window.resize).
   2. A standalone app with viewport-fit=cover always covers the entire
      screen, so in that mode screen.height IS the right answer — take the
      max with it, which stays correct even while innerHeight is stale and
      never waits on WebKit to catch up. */
function measureViewportHeight(): number {
  if (typeof window === "undefined") return 0;

  const candidates = [
    window.innerHeight,
    document.documentElement.clientHeight,
  ];

  // navigator.standalone is WebKit-only, and true for home-screen apps
  // whether they were installed from Safari or Chrome (both are WebKit on
  // iOS). Deliberately NOT the display-mode:standalone media query — that
  // also matches Android, where the status bar sits outside the webview
  // and screen.height would overshoot. Portrait-only because iOS reports
  // screen.height as the portrait long edge regardless of rotation.
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (iosStandalone && window.matchMedia("(orientation: portrait)").matches) {
    candidates.push(window.screen.height);
  }

  return Math.max(...candidates);
}

function useViewportHeight() {
  const [height, setHeight] = useState(measureViewportHeight);

  useEffect(() => {
    const measure = () => setHeight(measureViewportHeight());

    const settleTimers = [100, 400, 1000, 2500].map((delay) =>
      window.setTimeout(measure, delay)
    );

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("pageshow", measure);
    window.visualViewport?.addEventListener("resize", measure);

    return () => {
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("pageshow", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  return height;
}

function MobileContainer({ children, bleedTop = false }: MobileContainerProps) {
  const viewportHeight = useViewportHeight();

  return (
    <div
      className="app-gradient-bg pt-safe relative mx-auto max-w-md overflow-hidden shadow-2xl"
      style={{ height: viewportHeight }}
    >
      <MeshGradientBackground colorA="#3b9149" colorB="#faea5c" />
      <div className={`relative z-10 h-full ${bleedTop ? "bleed-top-safe" : ""}`}>
        {children}
      </div>
    </div>
  );
}

export default MobileContainer;
