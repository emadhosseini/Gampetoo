interface MeshGradientBackgroundProps {
  className?: string;
}

// The background image itself, not a CSS approximation of it. Served as a
// 9KB WebP (the source PNG was 1.1MB — a smooth gradient re-encodes almost
// to nothing in WebP), precached by the service worker like every other
// static asset, so it's on screen from the first paint offline too.
//
// It stays a plain background-image on a static div for the same reason the
// gradient before it did: this component sits under the whole app shell,
// the login page and the error screen, so anything expensive here is
// expensive everywhere. An earlier version animated two blur(110px) layers
// forever and pegged the phone's GPU at idle. Do not reintroduce blur()
// layers, infinite animations, or a noise overlay here.
export default function MeshGradientBackground({
  className = "",
}: MeshGradientBackgroundProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-cover bg-center ${className}`}
      aria-hidden="true"
      style={{ backgroundImage: "url(/BG.webp)" }}
    />
  );
}
