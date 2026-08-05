interface MeshGradientBackgroundProps {
  className?: string;
}

// The background image itself, not a CSS approximation of it. Served as a
// 25KB WebP at the source's full 853x1844, precached by the service worker
// like every other static asset, so it's on screen from the first paint
// offline too.
//
// The encoding is deliberately quality 95 with smartSubsample rather than the
// ~6KB a lower quality would give: this is one big smooth gradient, and the
// failure mode of over-compressing a gradient is banding — flat plateaus with
// a visible step between them, worst on a dark OLED panel, which is most of
// this image. At q95 the whole frame stays within 5/255 of the source even
// after the browser upscales it to cover the viewport. Don't trade those
// bytes away; it's a one-time precached fetch.
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
