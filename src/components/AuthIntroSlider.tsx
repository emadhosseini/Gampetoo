import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Screenshots of the app itself, one per thing worth showing before anyone
// has an account. Served from public/slider as plain URLs, so they're
// precached with the rest of the build (the workbox glob covers webp).
const SLIDES = [
  {
    src: "/slider/01.webp",
    caption: "هر روز صبح ببین امروز چه تمرینی داری و فردا چه خبره",
  },
  {
    src: "/slider/02.webp",
    caption: "کالری، وزن، فعالیت و آب روزانه‌ات یک‌جا و قابل پیگیری",
  },
  {
    src: "/slider/03.webp",
    caption: "غذاها رو دستی ثبت کن یا بگو چی خوردی تا هوش مصنوعی حسابش کنه",
  },
];

const AUTO_ADVANCE_MS = 4500;
// Past this much horizontal travel, a drag counts as "go to the next one"
// rather than a stray touch while scrolling.
const SWIPE_THRESHOLD_PX = 50;

export default function AuthIntroSlider() {
  const [index, setIndex] = useState(0);
  // Which way the next slide should come in from — set by whichever thing
  // caused the change, so a swipe backward animates backward.
  const [direction, setDirection] = useState(1);
  // A manual swipe or dot tap stops the carousel moving on its own: it's
  // gone from "here's a tour" to "I'm looking at this one".
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const timer = setTimeout(
      () => go(1),
      AUTO_ADVANCE_MS,
    );

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused]);

  function go(step: number) {
    setDirection(step);
    setIndex((current) => (current + step + SLIDES.length) % SLIDES.length);
  }

  const slide = SLIDES[index];

  return (
    <div className="glass-panel glass-static w-full overflow-hidden rounded-3xl px-5 pb-5 pt-6">
      {/* Caption above the screenshot, matching the reference layout. Fixed
          minimum height so a one-line caption and a two-line one don't move
          the phone below them as the slides change. */}
      <div className="flex min-h-14 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-center text-base font-bold leading-7 text-white"
          >
            {slide.caption}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* The phone screenshots are cropped at the bottom by design — they
          run off the lower edge of the card rather than sitting inside it,
          which is what makes the card read as a window onto the app. */}
      <div className="relative mt-4 h-64 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.img
            key={index}
            src={slide.src}
            alt=""
            aria-hidden="true"
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) < SWIPE_THRESHOLD_PX) return;

              setPaused(true);
              // RTL: dragging right (positive x) moves toward the next
              // slide, the same direction reading runs.
              go(info.offset.x > 0 ? 1 : -1);
            }}
            className="absolute inset-x-0 top-0 mx-auto h-auto w-56 max-w-full cursor-grab select-none active:cursor-grabbing"
          />
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {SLIDES.map((item, i) => (
          <button
            key={item.src}
            onClick={() => {
              setPaused(true);
              setDirection(i > index ? 1 : -1);
              setIndex(i);
            }}
            aria-label={`اسلاید ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
