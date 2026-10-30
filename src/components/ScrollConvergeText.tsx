import { useRef, useState, useEffect } from "react";
import {
  useScroll,
  useTransform,
  motion,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

interface ConvergeLine {
  text: string;
  className?: string;
}

interface ScrollConvergeTextProps {
  lines: ConvergeLine[];
  className?: string;
  isLighter?: boolean; // Lighter variant for section headings (smaller offset, no 3D rotation)
}

function ConvergeLetter({
  char,
  distance,
  multiplier,
  progress,
  hasRotation,
}: {
  char: string;
  distance: number;
  multiplier: number;
  progress: MotionValue<number>;
  hasRotation: boolean;
}) {
  const x = useTransform(progress, [0, 1], [distance * multiplier, 0]);
  const y = useTransform(progress, [0, 1], [hasRotation ? 0 : 8, 0]);
  const opacity = useTransform(progress, [0, 0.75, 1], [0.25, 0.85, 1]);
  const blur = useTransform(progress, [0, 1], ["blur(4px)", "blur(0px)"]);
  const rotateX = useTransform(
    progress,
    [0, 1],
    hasRotation ? [distance < 0 ? -18 : 18, 0] : [0, 0]
  );

  return (
    <motion.span
      style={{
        x,
        y,
        opacity,
        filter: blur,
        rotateX,
        transformOrigin: "center center",
      }}
      className="inline-block"
      aria-hidden="true"
    >
      {char}
    </motion.span>
  );
}

export function ScrollConvergeText({
  lines,
  className,
  isLighter = false,
}: ScrollConvergeTextProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const isReduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center 65%"],
  });

  const fullAriaLabel = lines.map((l) => l.text).join(" ");

  // Full accessibility fallback for prefers-reduced-motion
  if (isReduced) {
    return (
      <h2
        className={cn(
          "font-black text-4xl md:text-6xl leading-[1.0] tracking-[-0.03em] font-display",
          className
        )}
        aria-label={fullAriaLabel}
      >
        {lines.map((l, i) => (
          <span key={i} className={cn("block", l.className)}>
            {l.text}
          </span>
        ))}
      </h2>
    );
  }

  // Multipliers: smaller on mobile to prevent clipping/overflow; lighter variant is subtle
  const multiplier = isLighter
    ? isMobile
      ? 7
      : 14
    : isMobile
      ? 18
      : 36;

  const hasRotation = !isLighter;

  return (
    <h2
      ref={containerRef}
      className={cn(
        "font-black text-4xl md:text-6xl leading-[1.0] tracking-[-0.03em] font-display overflow-hidden",
        className
      )}
      style={{ perspective: "1000px" }}
      aria-label={fullAriaLabel}
    >
      {lines.map((line, lineIdx) => {
        const totalChars = line.text.length;
        const center = (totalChars - 1) / 2;
        const words = line.text.split(" ");
        let charCounter = 0;

        return (
          <span
            key={lineIdx}
            className={cn("block overflow-hidden py-1", line.className)}
            aria-hidden="true"
          >
            {words.map((word, wordIdx) => {
              const wordLetters = word.split("");
              const startIndex = charCounter;
              charCounter += word.length + 1; // +1 for the following space

              return (
                <span key={wordIdx} className="inline-block whitespace-nowrap">
                  {wordLetters.map((char, charIdx) => {
                    const globalIdx = startIndex + charIdx;
                    const distance = globalIdx - center;

                    return (
                      <ConvergeLetter
                        key={charIdx}
                        char={char}
                        distance={distance}
                        multiplier={multiplier}
                        progress={scrollYProgress}
                        hasRotation={hasRotation}
                      />
                    );
                  })}
                  {wordIdx < words.length - 1 && (
                    <span className="inline-block" aria-hidden="true">
                      &nbsp;
                    </span>
                  )}
                </span>
              );
            })}
          </span>
        );
      })}
    </h2>
  );
}

