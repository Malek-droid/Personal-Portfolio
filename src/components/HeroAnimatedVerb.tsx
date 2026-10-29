import { useEffect, useRef, useState } from "react";

/**
 * Configuration for the hero rolling verb sequence.
 * Easily tweak words, hold times, animation durations, and easing curves here.
 */
export const HERO_VERB_CONFIG = {
  words: ["work", "learn", "decide", "think"] as const,
  holdDurationMs: 1100, // Duration each word is held before the next roll begins
  transitionDurationMs: 650, // Duration of each letter's vertical slide & blur transition
  staggerMs: 25, // Stagger delay (ms) rippling across letters left-to-right
  easing: "cubic-bezier(0.22, 1, 0.36, 1)", // Fluid fast-start with soft landing
  glowDurationMs: 1200, // One-time violet glow sweep when "think" lands
  initialDelayMs: 350, // Small delay after boot screen clears before starting
};

type TransitionPhase = "prep" | "active";

interface RollingState {
  isRolling: boolean;
  fromWord: string;
  toWord: string;
  phase: TransitionPhase;
}

export function HeroAnimatedVerb() {
  const [currentWord, setCurrentWord] = useState<string>(HERO_VERB_CONFIG.words[0]);
  const [rollingState, setRollingState] = useState<RollingState>({
    isRolling: false,
    fromWord: "",
    toWord: "",
    phase: "prep",
  });
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const [isFinalGlow, setIsFinalGlow] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const wordIndexRef = useRef(0);
  const measureContainerRef = useRef<HTMLSpanElement>(null);
  const widthsRef = useRef<Record<string, number>>({});
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasStartedRef = useRef(false);

  // Helper to schedule self-cleaning timeouts
  const scheduleTimeout = (fn: () => void, delayMs: number) => {
    const id = setTimeout(fn, delayMs);
    timeoutIdsRef.current.push(id);
    return id;
  };

  // Measure word rendered widths on mount and window resize
  const measureWidths = () => {
    if (!measureContainerRef.current) return;
    const children = measureContainerRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const w = HERO_VERB_CONFIG.words[i];
      if (w && child) {
        const measured = child.getBoundingClientRect().width;
        if (measured > 0) {
          widthsRef.current[w] = measured;
        }
      }
    }
    const active = HERO_VERB_CONFIG.words[wordIndexRef.current] || HERO_VERB_CONFIG.words[0];
    if (widthsRef.current[active]) {
      setContainerWidth(widthsRef.current[active]);
    }
  };

  // Execution of the roll from one word to the next
  const rollToNext = (targetIndex: number) => {
    const from = HERO_VERB_CONFIG.words[wordIndexRef.current];
    const to = HERO_VERB_CONFIG.words[targetIndex];
    if (!from || !to) return;

    wordIndexRef.current = targetIndex;

    // 1. Set prep phase so incoming letters mount at translateY(100%)
    setRollingState({
      isRolling: true,
      fromWord: from,
      toWord: to,
      phase: "prep",
    });

    // Animate container width to new word width simultaneously
    if (widthsRef.current[to]) {
      setContainerWidth(widthsRef.current[to]);
    }

    // 2. Next animation frame: activate transition to animate outgoing up and incoming in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRollingState({
          isRolling: true,
          fromWord: from,
          toWord: to,
          phase: "active",
        });
      });
    });

    // 3. When letters transition settles: settle state
    const maxChars = Math.max(from.length, to.length);
    const totalTransitionMs =
      HERO_VERB_CONFIG.transitionDurationMs + maxChars * HERO_VERB_CONFIG.staggerMs + 30;

    scheduleTimeout(() => {
      setCurrentWord(to);
      setRollingState({
        isRolling: false,
        fromWord: "",
        toWord: "",
        phase: "prep",
      });

      // Check if we reached the final word "think"
      if (to === "think") {
        setIsFinalGlow(true);
        scheduleTimeout(() => {
          setIsFinalGlow(false);
        }, HERO_VERB_CONFIG.glowDurationMs + 5 * 60 + 50);
        return;
      }

      // Otherwise hold and roll to next word
      scheduleTimeout(() => {
        rollToNext(targetIndex + 1);
      }, HERO_VERB_CONFIG.holdDurationMs);
    }, totalTransitionMs);
  };

  // Orchestrate start after boot sequence completes
  useEffect(() => {
    // Check reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsReducedMotion(true);
      setCurrentWord("think");
      return;
    }

    // Initial measurement
    measureWidths();
    window.addEventListener("resize", measureWidths);

    const startSequence = () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      // Re-measure just before start to ensure fonts are fully settled
      measureWidths();

      // Hold initial word "work", then start rolling
      scheduleTimeout(() => {
        rollToNext(1);
      }, HERO_VERB_CONFIG.holdDurationMs);
    };

    const isAlreadyBooted =
      Boolean((window as unknown as { __portfolioBooted?: boolean }).__portfolioBooted) ||
      Boolean(sessionStorage.getItem("malek_booted"));

    if (isAlreadyBooted) {
      scheduleTimeout(startSequence, HERO_VERB_CONFIG.initialDelayMs);
    } else {
      const handleBootComplete = () => {
        scheduleTimeout(startSequence, HERO_VERB_CONFIG.initialDelayMs);
      };
      window.addEventListener("portfolio:boot-complete", handleBootComplete, { once: true });
      return () => {
        window.removeEventListener("portfolio:boot-complete", handleBootComplete);
        window.removeEventListener("resize", measureWidths);
        timeoutIdsRef.current.forEach((id) => clearTimeout(id));
      };
    }

    return () => {
      window.removeEventListener("resize", measureWidths);
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  // If prefers-reduced-motion: render static final word
  if (isReducedMotion) {
    return (
      <span className="inline-block" aria-hidden="true">
        think
      </span>
    );
  }

  return (
    <>
      {/* Hidden off-screen measurement span (matches typography exactly) */}
      <span
        ref={measureContainerRef}
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

      {/* Visible animated verb container with overflow-hidden mask */}
      <span
        className="inline-block relative overflow-hidden align-baseline text-left"
        style={{
          width: containerWidth !== undefined ? `${containerWidth}px` : "auto",
          transition: rollingState.isRolling
            ? `width ${HERO_VERB_CONFIG.transitionDurationMs}ms ${HERO_VERB_CONFIG.easing}`
            : "none",
          paddingTop: "0.12em",
          paddingBottom: "0.15em",
          marginTop: "-0.12em",
          marginBottom: "-0.15em",
        }}
        aria-hidden="true"
      >
        {!rollingState.isRolling ? (
          // Settle / Idle state: display current word characters
          <span className="inline-flex whitespace-nowrap">
            {currentWord.split("").map((char, i) => (
              <span
                key={`${currentWord}-${i}`}
                className={`inline-block ${isFinalGlow ? "hero-verb-glow-char" : ""}`}
                style={isFinalGlow ? { animationDelay: `${i * 65}ms` } : undefined}
              >
                {char}
              </span>
            ))}
          </span>
        ) : (
          // Rolling transition state: outgoing translate up, incoming translate from below
          <span className="inline-flex relative whitespace-nowrap">
            {/* Outgoing letters */}
            <span className="inline-flex whitespace-nowrap pointer-events-none select-none">
              {rollingState.fromWord.split("").map((char, i) => {
                const isActive = rollingState.phase === "active";
                return (
                  <span
                    key={`out-${rollingState.fromWord}-${i}`}
                    className="inline-block"
                    style={{
                      transform: isActive ? "translateY(-105%)" : "translateY(0%)",
                      opacity: isActive ? 0 : 1,
                      filter: isActive ? "blur(6px)" : "blur(0px)",
                      transition: `transform ${HERO_VERB_CONFIG.transitionDurationMs}ms ${HERO_VERB_CONFIG.easing} ${i * HERO_VERB_CONFIG.staggerMs}ms, opacity ${HERO_VERB_CONFIG.transitionDurationMs}ms ${HERO_VERB_CONFIG.easing} ${i * HERO_VERB_CONFIG.staggerMs}ms, filter ${HERO_VERB_CONFIG.transitionDurationMs}ms ${HERO_VERB_CONFIG.easing} ${i * HERO_VERB_CONFIG.staggerMs}ms`,
                      willChange: isActive ? "transform, opacity, filter" : "auto",
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </span>

            {/* Incoming letters */}
            <span className="inline-flex absolute inset-0 whitespace-nowrap pointer-events-none select-none">
              {rollingState.toWord.split("").map((char, i) => {
                const isActive = rollingState.phase === "active";
                return (
                  <span
                    key={`in-${rollingState.toWord}-${i}`}
                    className="inline-block"
                    style={{
                      transform: isActive ? "translateY(0%)" : "translateY(105%)",
                      opacity: isActive ? 1 : 0,
                      filter: isActive ? "blur(0px)" : "blur(6px)",
                      transition: `transform ${HERO_VERB_CONFIG.transitionDurationMs}ms ${HERO_VERB_CONFIG.easing} ${i * HERO_VERB_CONFIG.staggerMs}ms, opacity ${HERO_VERB_CONFIG.transitionDurationMs}ms ${HERO_VERB_CONFIG.easing} ${i * HERO_VERB_CONFIG.staggerMs}ms, filter ${HERO_VERB_CONFIG.transitionDurationMs}ms ${HERO_VERB_CONFIG.easing} ${i * HERO_VERB_CONFIG.staggerMs}ms`,
                      willChange: isActive ? "transform, opacity, filter" : "auto",
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
          </span>
        )}
      </span>
    </>
  );
}
