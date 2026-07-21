const NOISE_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

interface NoiseLayerProps {
  opacity?: number;
}

export default function NoiseLayer({ opacity = 0.05 }: NoiseLayerProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 mix-blend-overlay"
      style={{
        opacity,
        backgroundImage: `url("${NOISE_DATA_URL}")`,
        backgroundSize: "120px 120px",
      }}
      aria-hidden="true"
    />
  );
}
