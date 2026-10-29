import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Configuration for the Hero AnimatedTextCycle component.
 * Words, hold interval, transition duration, and spring dynamics are defined here.
 */
export const HERO_VERB_CONFIG = {
  words: ["work", "learn", "decide", "think"] as const,
  intervalMs: 1200, // Duration each word is held before advancing (1.2s)
  transitionDuration: 0.65, // Duration of the vertical slide & blur transition (s)
  spring: {
    type: "spring" as const,
    stiffness: 240,
    damping: 30, // High damping to eliminate overshoot and bounce
    mass: 1,
  },
  glowDurationMs: 1200, // One-time soft violet glow on "think"
  initialDelayMs: 350, // Small delay after boot screen clears before starting
};

export function HeroAnimatedVerb() {
  const isReduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const [isFinalGlow, setIsFinalGlow] = useState(false);

  const measureRef = useRef<HTMLSpanElement>(null);
  const widthsRef = useRef<Record<string, number>>({});
  const hasStartedRef = useRef(false);
  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Function to measure each word width matching the real headline font size/weight
  const measure = () => {
    if (!measureRef.current) return;
    const children = measureRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const w = HERO_VERB_CONFIG.words[i];
      if (w && el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0) {
          widthsRef.current[w] = rect.width;
        }
      }
    }
    const current = HERO_VERB_CONFIG.words[index];
    if (widthsRef.current[current]) {
      setContainerWidth(widthsRef.current[current]);
    }
  };

  // Measure on mount, re-measure after fonts load, and on window resize
  useEffect(() => {
    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Update container width target whenever word changes
  useEffect(() => {
    const current = HERO_VERB_CONFIG.words[index];
    if (widthsRef.current[current]) {
      setContainerWidth(widthsRef.current[current]);
    }
  }, [index]);

  // Orchestrate the non-looping sequence: work -> learn -> decide -> think
  useEffect(() => {
    if (isReduced) return;

    const startCycle = () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;
      measure();

      let currentStep = 0;

      const advance = () => {
        if (currentStep < HERO_VERB_CONFIG.words.length - 1) {
          currentStep += 1;
          setIndex(currentStep);

          if (currentStep === HERO_VERB_CONFIG.words.length - 1) {
            // Reached final word "think" - stop cycling forever and clear all timers
            const glowTimer = setTimeout(() => {
              setIsFinalGlow(true);
              const clearGlowTimer = setTimeout(() => {
                setIsFinalGlow(false);
              }, HERO_VERB_CONFIG.glowDurationMs);
              timerIdsRef.current.push(clearGlowTimer);
            }, HERO_VERB_CONFIG.transitionDuration * 1000);
            timerIdsRef.current.push(glowTimer);
          } else {
            // Schedule next word transition
            const nextTimer = setTimeout(
              advance,
              HERO_VERB_CONFIG.intervalMs + HERO_VERB_CONFIG.transitionDuration * 1000
            );
            timerIdsRef.current.push(nextTimer);
          }
        }
      };

      // Hold initial word "work" before advancing to "learn"
      const firstTimer = setTimeout(advance, HERO_VERB_CONFIG.intervalMs);
      timerIdsRef.current.push(firstTimer);
    };

    const isAlreadyBooted =
      Boolean((window as unknown as { __portfolioBooted?: boolean }).__portfolioBooted) ||
      Boolean(sessionStorage.getItem("malek_booted"));

    let bootTimer: ReturnType<typeof setTimeout> | null = null;
    if (isAlreadyBooted) {
      bootTimer = setTimeout(startCycle, HERO_VERB_CONFIG.initialDelayMs);
    } else {
      const handleBootComplete = () => {
        bootTimer = setTimeout(startCycle, HERO_VERB_CONFIG.initialDelayMs);
      };
      window.addEventListener("portfolio:boot-complete", handleBootComplete, { once: true });
      return () => {
        window.removeEventListener("portfolio:boot-complete", handleBootComplete);
        if (bootTimer) clearTimeout(bootTimer);
        timerIdsRef.current.forEach((t) => clearTimeout(t));
      };
    }

    return () => {
      if (bootTimer) clearTimeout(bootTimer);
      timerIdsRef.current.forEach((t) => clearTimeout(t));
    };
  }, [isReduced]);

  // Accessibility: prefers-reduced-motion renders "think" immediately
  if (isReduced) {
    return (
      <span className="inline-block" aria-hidden="true">
        think
      </span>
    );
  }

  const activeWord = HERO_VERB_CONFIG.words[index];

  return (
    <>
      {/* Hidden off-screen measurement elements (exact same font, weight, tracking) */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none select-none -z-50 font-black tracking-[-0.03em] font-display whitespace-nowrap"
        style={{
          visibility: "hidden",
          position: "absolute",
          top: 0,
          left: 0,
          height: 0,
          overflow: "hidden",
        }}
      >
        {HERO_VERB_CONFIG.words.map((w) => (
          <span key={w} className="inline-block">
            {w}
          </span>
        ))}
      </span>

      {/* Spring-animated width container (Framer Motion) */}
      <motion.span
        className="inline-block overflow-hidden align-baseline relative text-left"
        animate={{ width: containerWidth ? containerWidth : "auto" }}
        transition={HERO_VERB_CONFIG.spring}
        style={{
          paddingTop: "0.12em",
          paddingBottom: "0.15em",
          marginTop: "-0.12em",
          marginBottom: "-0.15em",
          verticalAlign: "baseline",
        }}
        aria-hidden="true"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={activeWord}
            initial={{ y: "110%", opacity: 0, filter: "blur(6px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-110%", opacity: 0, filter: "blur(6px)" }}
            transition={{
              y: { duration: HERO_VERB_CONFIG.transitionDuration, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: HERO_VERB_CONFIG.transitionDuration * 0.85, ease: "linear" },
              filter: { duration: HERO_VERB_CONFIG.transitionDuration * 0.85, ease: "easeOut" },
            }}
            className={cn(
              "inline-block whitespace-nowrap select-none",
              isFinalGlow && "hero-verb-glow-char"
            )}
          >
            {activeWord}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
}
