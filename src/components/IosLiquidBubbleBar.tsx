import { motion } from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { hapticSelection } from "@/native/haptics";

export interface LiquidBubbleTabItem<T extends string> {
  id: T;
  renderContent: (state: { isActive: boolean; isHovered: boolean }) => ReactNode;
  ariaLabel?: string;
}

export interface IosLiquidBubbleBarProps<T extends string> {
  items: LiquidBubbleTabItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  ariaLabel?: string;
  heightClass?: string;
  className?: string;
}

interface SlotRect {
  left: number;
  width: number;
}

const DRAG_THRESHOLD_PX = 6;

/**
 * Apple iOS 26/27 Liquid Glass interactive bubble dock/tab bar.
 *
 * - Tap any item: the refractive glass droplet launches with an elastic
 *   squash-and-stretch morph and bouncy spring settle.
 * - Press & drag across the bar: the glass droplet lifts, magnifies, and
 *   glides under your thumb with haptic ticks at each tab boundary, snapping
 *   into the hovered tab on release.
 */
export default function IosLiquidBubbleBar<T extends string>({
  items,
  activeId,
  onSelect,
  ariaLabel,
  heightClass = "h-[62px]",
  className = "",
}: IosLiquidBubbleBarProps<T>) {
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [slots, setSlots] = useState<Record<string, SlotRect>>({});
  const [dragging, setDragging] = useState(false);
  const [dragCenterX, setDragCenterX] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<T | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  const prevActiveRef = useRef(activeId);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    isDragging: boolean;
    lastHoveredId: T | null;
    navLeft: number;
    navWidth: number;
  } | null>(null);

  useEffect(() => {
    if (prevActiveRef.current !== activeId) {
      prevActiveRef.current = activeId;
      setPulseKey((k) => k + 1);
    }
  }, [activeId]);

  useLayoutEffect(() => {
    function measure() {
      const nav = navRef.current;
      if (!nav) return;
      const navRect = nav.getBoundingClientRect();
      const next: Record<string, SlotRect> = {};

      for (const item of items) {
        const el = itemRefs.current[item.id];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        next[item.id] = {
          left: rect.left - navRect.left,
          width: rect.width,
        };
      }

      setSlots(next);
    }

    measure();
    const observer = new ResizeObserver(measure);
    if (navRef.current) observer.observe(navRef.current);
    return () => observer.disconnect();
  }, [items]);

  function findItemAtX(localX: number): T {
    let bestId = activeId;
    let bestDist = Infinity;

    for (const item of items) {
      const slot = slots[item.id];
      if (!slot) continue;
      if (localX >= slot.left && localX <= slot.left + slot.width) {
        return item.id;
      }
      const center = slot.left + slot.width / 2;
      const dist = Math.abs(localX - center);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = item.id;
      }
    }

    return bestId;
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const navRect = navRef.current?.getBoundingClientRect();
    if (!navRect) return;

    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      isDragging: false,
      lastHoveredId: activeId,
      navLeft: navRect.left,
      navWidth: navRect.width,
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLElement>) {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    if (!state.isDragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      state.isDragging = true;
      setDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if capture is unavailable.
      }
    }

    const localX = e.clientX - state.navLeft;
    const hitId = findItemAtX(localX);
    const activeSlot = slots[hitId] ?? slots[activeId];
    const halfW = (activeSlot?.width ?? 64) / 2;
    const clampedCenter = Math.max(
      halfW + 4,
      Math.min(state.navWidth - halfW - 4, localX),
    );

    setDragCenterX(clampedCenter);
    setHoveredId(hitId);

    if (hitId !== state.lastHoveredId) {
      state.lastHoveredId = hitId;
      hapticSelection();
    }
  }

  function finishDrag(e: ReactPointerEvent<HTMLElement>, cancelled: boolean) {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    dragStateRef.current = null;

    if (!state.isDragging) return;

    const targetId = !cancelled ? state.lastHoveredId : null;
    setDragging(false);
    setDragCenterX(null);
    setHoveredId(null);

    if (targetId && targetId !== activeId) {
      onSelect(targetId);
    } else {
      setPulseKey((k) => k + 1);
    }
  }

  const visualId = dragging && hoveredId ? hoveredId : activeId;
  const activeSlot = slots[visualId] ?? slots[activeId];

  const bubbleWidth = activeSlot ? Math.max(0, activeSlot.width - 4) : 0;
  const bubbleX =
    dragging && dragCenterX !== null
      ? dragCenterX - bubbleWidth / 2
      : activeSlot
        ? activeSlot.left + 2
        : 0;

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      data-no-tab-swipe="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => finishDrag(e, false)}
      onPointerCancel={(e) => finishDrag(e, true)}
      className={`ios-glass-dock relative flex ${heightClass} touch-none items-center justify-between rounded-full p-1 select-none ${className}`}
    >
      {/* Interactive Refractive Liquid Glass Droplet */}
      {activeSlot && bubbleWidth > 0 && (
        <motion.div
          aria-hidden="true"
          animate={{
            x: bubbleX,
            width: bubbleWidth,
            scale: dragging ? 1.08 : 1,
            scaleY: dragging ? 1.12 : 1,
          }}
          transition={
            dragging
              ? { type: "spring", stiffness: 620, damping: 34, mass: 0.45 }
              : { type: "spring", stiffness: 360, damping: 22, mass: 0.85 }
          }
          className={`pointer-events-none absolute inset-y-1 left-0 z-0 rounded-full transition-shadow duration-150 ${
            dragging ? "ios-glass-lens-dragging" : "ios-glass-lens"
          }`}
        >
          {/* Elastic bubble pop inner shimmer on tab switch */}
          <motion.div
            key={pulseKey}
            initial={{ scaleX: 1.18, scaleY: 0.88, opacity: 0.9 }}
            animate={{ scaleX: 1, scaleY: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 18, mass: 0.7 }}
            className="h-full w-full rounded-full"
            style={{
              background:
                "radial-gradient(90% 70% at 50% 10%, rgb(255 255 255 / 22%) 0%, transparent 70%)",
            }}
          />
        </motion.div>
      )}

      {items.map((item) => {
        const isActive = item.id === activeId;
        const isHovered = dragging && item.id === hoveredId;
        const highlighted = dragging ? isHovered : isActive;

        return (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[item.id] = el;
            }}
            type="button"
            aria-label={item.ariaLabel}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              if (dragging) return;
              hapticSelection();
              if (item.id !== activeId) {
                onSelect(item.id);
              } else {
                setPulseKey((k) => k + 1);
              }
            }}
            className="relative z-10 flex h-full flex-1 items-center justify-center [-webkit-tap-highlight-color:transparent]"
          >
            <motion.span
              animate={
                highlighted
                  ? { scale: dragging ? 1.12 : 1.05, y: dragging ? -1.5 : 0 }
                  : { scale: 1, y: 0 }
              }
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 460, damping: 22 }}
              className="flex items-center justify-center"
            >
              {item.renderContent({ isActive: highlighted, isHovered })}
            </motion.span>
          </button>
        );
      })}
    </nav>
  );
}
