import { useEffect, useState } from "react";

import MeshGradientBackground from "@/components/background/MeshGradientBackground";

type MobileContainerProps = {
  children: React.ReactNode;
};

/* On an iOS home-screen-installed (standalone) PWA, window.innerHeight
   (and 100dvh) can report a too-short value on cold launch — it only
   settles to the real height once WebKit finishes a later layout pass,
   which previously only happened to get triggered by the user manually
   scrolling. Re-measuring a few times shortly after mount (instead of
   relying on the user to scroll) catches that settle without needing a
   CSS viewport unit at all. */
function useViewportHeight() {
  const [height, setHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 0
  );

  useEffect(() => {
    const measure = () => setHeight(window.innerHeight);

    const settleTimers = [100, 400, 1000].map((delay) =>
      window.setTimeout(measure, delay)
    );

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("pageshow", measure);

    return () => {
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("pageshow", measure);
    };
  }, []);

  return height;
}

function MobileContainer({ children }: MobileContainerProps) {
  const viewportHeight = useViewportHeight();

  return (
    <div
      className="app-gradient-bg pt-safe relative mx-auto max-w-md overflow-hidden shadow-2xl"
      style={{ height: viewportHeight }}
    >
      <MeshGradientBackground colorA="#3b9149" colorB="#faea5c" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export default MobileContainer;
