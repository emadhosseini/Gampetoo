import { useEffect, useState } from "react";

interface WaitingDotsProps {
  label?: string;
}

// "منتظر باش ..." with the dots building up one at a time then resetting to
// zero, looped — the standard "AI is thinking" indicator, reused anywhere a
// screen is waiting on an AI response.
export default function WaitingDots({ label = "منتظر باش" }: WaitingDotsProps) {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((count) => (count + 1) % 4);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <span>
      {label} {".".repeat(dotCount)}
    </span>
  );
}
