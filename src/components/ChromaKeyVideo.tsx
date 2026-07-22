import { useEffect, useRef, useState } from "react";

interface ChromaKeyVideoProps {
  src: string;
  /** Rendered size in CSS pixels (square). */
  size: number;
  className?: string;
}

// The source clip has no alpha channel — it's a plain opaque video with a
// black background, and its own compression leaves a faint dark halo (up to
// roughly rgb 55) along the mascot's edges. Safari silently ignores
// mix-blend-mode on <video> elements, so a CSS-only fix (which looked right
// in Chromium) still showed a solid black box on iOS.
//
// Instead we draw each frame to a canvas and key out near-black pixels
// ourselves: alpha ramps from 0 (true black) to fully opaque by LUMA_HIGH,
// comfortably above that compression halo, so real artwork colors (the grey
// dumbbell, dark shading) are never touched — only true background and its
// immediate edge feather become transparent.
const LUMA_LOW = 8;
const LUMA_HIGH = 64;

function lumaKeyFrame(imageData: ImageData) {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const luma = Math.max(data[i], data[i + 1], data[i + 2]);

    if (luma <= LUMA_LOW) {
      data[i + 3] = 0;
    } else if (luma < LUMA_HIGH) {
      data[i + 3] = Math.round(
        ((luma - LUMA_LOW) / (LUMA_HIGH - LUMA_LOW)) * 255,
      );
    }
  }
}

export default function ChromaKeyVideo({
  src,
  size,
  className = "",
}: ChromaKeyVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const resolution = Math.round(size * Math.min(window.devicePixelRatio || 1, 2));

    canvas.width = resolution;
    canvas.height = resolution;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return;

    let rafId: number;

    function draw() {
      if (video && ctx && video.readyState >= video.HAVE_CURRENT_DATA) {
        try {
          ctx.drawImage(video, 0, 0, canvas!.width, canvas!.height);

          const frame = ctx.getImageData(0, 0, canvas!.width, canvas!.height);
          lumaKeyFrame(frame);
          ctx.putImageData(frame, 0, 0);
        } catch {
          // A device/browser that can't read video pixels back onto a
          // canvas (some older WebKit builds treat this as a tainted
          // canvas) — bail out to the plain <video> instead of looping on
          // an operation that will keep failing every frame.
          setBroken(true);
          return;
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafId);
  }, [size]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* iOS Safari can promote an autoplaying <video> to its own hardware
          compositor layer, which ignores CSS opacity/visibility — so an
          opacity-0 video sitting on top of the canvas still painted its raw
          black frame over it. Moving it fully outside the viewport (rather
          than hiding it in place) sidesteps that entirely. */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={
          broken
            ? { width: size, height: size, mixBlendMode: "screen" }
            : {
                position: "fixed",
                top: -9999,
                left: -9999,
                width: size,
                height: size,
                pointerEvents: "none",
              }
        }
      />

      {!broken && (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}
