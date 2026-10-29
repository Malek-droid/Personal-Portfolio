import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

/* ── Named constants ── */
const STRENGTH = 0.3;
const MAX_OFFSET_PX = 10;
const SPRING_CONFIG = {
  stiffness: 200,
  damping: 15,
  mass: 0.5,
} as const;

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
}

export function MagneticButton({ children, className }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(isFinePointer && !isReducedMotion);

    const handleMediaChange = () => {
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setEnabled(fine && !reduced);
    };

    const hoverMq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    hoverMq.addEventListener("change", handleMediaChange);
    motionMq.addEventListener("change", handleMediaChange);

    return () => {
      hoverMq.removeEventListener("change", handleMediaChange);
      motionMq.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, SPRING_CONFIG);
  const springY = useSpring(y, SPRING_CONFIG);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawOffsetX = (e.clientX - centerX) * STRENGTH;
    const rawOffsetY = (e.clientY - centerY) * STRENGTH;

    const clampedX = Math.max(-MAX_OFFSET_PX, Math.min(MAX_OFFSET_PX, rawOffsetX));
    const clampedY = Math.max(-MAX_OFFSET_PX, Math.min(MAX_OFFSET_PX, rawOffsetY));

    x.set(clampedX);
    y.set(clampedY);
  };

  const handlePointerLeave = () => {
    if (!enabled) return;
    x.set(0);
    y.set(0);
  };

  if (!enabled) {
    return <div className={cn("inline-block", className)}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ x: springX, y: springY }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}
