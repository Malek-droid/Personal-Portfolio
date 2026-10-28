import React, { useCallback, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Named constants — zero magic numbers
// ---------------------------------------------------------------------------

/** Total duration of the left-to-right decode sweep in milliseconds. */
const TOTAL_DURATION_MS = 1000;

/** Rapid finish duration in milliseconds when mouse leaves while animating. */
const FAST_FINISH_DURATION_MS = 160;

/**
 * Single-character glyph pool for scramble frames.
 * Digits, uppercase hex, and symbols. No spaces, no lowercase letters.
 */
const GLYPHS: readonly string[] = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "A", "B", "C", "D", "E", "F",
  "<", ">", "/", "{", "}", "[", "]",
  "#", "$", "%", "&", "*", "+", "=", "-", ";", ":"
];

/** Easing function for smooth deceleration toward the settled text. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BinaryTextProps {
  text: string;
  className?: string;
  /** Optional custom duration override in milliseconds. Defaults to TOTAL_DURATION_MS. */
  durationMs?: number;
}

/**
 * BinaryText
 *
 * Renders plain text that executes a smooth, decelerating left-to-right
 * binary decode sweep on hover/focus with:
 *
 * - A single requestAnimationFrame loop using time-based progress (performance.now).
 * - Zero React state updates per frame (direct DOM ref mutations).
 * - Zero layout shift: measures and locks exact subpixel character widths during
 *   the animation; clears all styles at rest so text renders with natural kerning.
 * - Monospace with tabular-nums for scrambling glyphs only.
 * - 2-3 glyph changes per character max before settling.
 * - Ignores re-hover while running.
 * - On mouseleave: finishes quickly to the real text, never freezes scrambled.
 * - Prefers-reduced-motion: renders static text with no animation.
 * - Multi-line wrapped text: animation is automatically skipped.
 * - Restores pristine text and cancels rAF on unmount.
 */
export function BinaryText({
  text,
  className = "",
  durationMs = TOTAL_DURATION_MS,
}: BinaryTextProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const isRunningRef = useRef(false);
  const isFastFinishingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const chars = text.split("");

  // Keep charRefs sized to match text length
  if (charRefs.current.length !== chars.length) {
    charRefs.current = new Array(chars.length).fill(null);
  }

  // -------------------------------------------------------------------------
  // DOM restoration helper
  // -------------------------------------------------------------------------

  const restoreRealText = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.style.width = "";
      wrapper.style.display = "";
    }

    for (let i = 0; i < chars.length; i++) {
      const el = charRefs.current[i];
      if (el) {
        el.textContent = chars[i];
        el.style.display = "";
        el.style.width = "";
        el.style.textAlign = "";
        el.style.overflow = "";
        el.style.verticalAlign = "";
        el.style.fontFamily = "";
        el.style.fontVariantNumeric = "";
      }
    }
  }, [chars]);

  // -------------------------------------------------------------------------
  // Mouseleave fast finish
  // -------------------------------------------------------------------------

  const handleLeave = useCallback(() => {
    if (!isRunningRef.current || isFastFinishingRef.current) return;
    isFastFinishingRef.current = true;
  }, []);

  // -------------------------------------------------------------------------
  // Core animation trigger
  // -------------------------------------------------------------------------

  const handleTrigger = useCallback(() => {
    // 1. Ignore if already running
    if (isRunningRef.current) return;

    // 2. Respect prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const wrapper = wrapperRef.current;
    if (!wrapper || chars.length === 0) return;

    // 3. Multi-line check: skip animation if text wraps across lines
    const firstSpan = charRefs.current[0];
    if (firstSpan) {
      const baseTop = firstSpan.offsetTop;
      for (let i = 1; i < chars.length; i++) {
        const el = charRefs.current[i];
        if (el && Math.abs(el.offsetTop - baseTop) > 4) {
          // Element is wrapped across multiple lines — do not animate
          return;
        }
      }
    }

    // 4. Measure exact subpixel widths before starting
    const measuredWidths: number[] = new Array(chars.length);
    for (let i = 0; i < chars.length; i++) {
      const el = charRefs.current[i];
      measuredWidths[i] = el ? el.getBoundingClientRect().width : 0;
    }

    const wrapperRect = wrapper.getBoundingClientRect();
    wrapper.style.width = `${wrapperRect.width}px`;
    wrapper.style.display = "inline-block";

    // Lock widths on each character span
    for (let i = 0; i < chars.length; i++) {
      const el = charRefs.current[i];
      if (el) {
        el.style.display = "inline-block";
        el.style.width = `${measuredWidths[i]}px`;
        el.style.textAlign = "center";
        el.style.overflow = "hidden";
        el.style.verticalAlign = "baseline";
      }
    }

    // 5. Pre-generate 2-3 random glyphs per non-space character
    const charScrambles: { count: number; glyphs: string[] }[] = [];
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === " ") {
        charScrambles.push({ count: 0, glyphs: [] });
        continue;
      }
      // Alternate 3 and 2 glyphs for organic variety
      const count = i % 2 === 0 ? 3 : 2;
      const glyphs: string[] = [];
      for (let g = 0; g < count; g++) {
        glyphs.push(GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
      }
      charScrambles.push({ count, glyphs });
    }

    // Dynamic wave window width based on string length (between 15% and 35%)
    const length = chars.length;
    const windowFraction = Math.min(0.35, Math.max(0.15, 3.5 / length));

    isRunningRef.current = true;
    isFastFinishingRef.current = false;

    const startTime = performance.now();
    const effectiveDuration = durationMs;

    let fastStartTime: number | null = null;
    let fastStartProgress = 0;

    function tick(now: number) {
      let progress = 0;

      if (isFastFinishingRef.current) {
        if (fastStartTime === null) {
          fastStartTime = now;
          const elapsed = now - startTime;
          const linearP = Math.min(1, elapsed / effectiveDuration);
          fastStartProgress = easeOutCubic(linearP);
        }
        const fastElapsed = now - fastStartTime;
        const fastLinear = Math.min(1, fastElapsed / FAST_FINISH_DURATION_MS);
        progress = fastStartProgress + (1 - fastStartProgress) * fastLinear;
      } else {
        const elapsed = now - startTime;
        const linearP = Math.min(1, elapsed / effectiveDuration);
        progress = easeOutCubic(linearP);
      }

      // Update character slots directly in DOM
      for (let i = 0; i < length; i++) {
        const el = charRefs.current[i];
        if (!el || chars[i] === " ") continue;

        const settleProgress = (i + 1) / length;
        const startProgress = Math.max(0, settleProgress - windowFraction);

        if (progress >= settleProgress) {
          // Settled to real text
          if (el.textContent !== chars[i]) {
            el.textContent = chars[i];
            el.style.fontFamily = "";
            el.style.fontVariantNumeric = "";
          }
        } else if (progress < startProgress) {
          // Not yet reached by the sweep
          if (el.textContent !== chars[i]) {
            el.textContent = chars[i];
            el.style.fontFamily = "";
            el.style.fontVariantNumeric = "";
          }
        } else {
          // Actively scrambling inside the wave
          const charT = (progress - startProgress) / (settleProgress - startProgress);
          const { count, glyphs } = charScrambles[i];
          const step = Math.min(count - 1, Math.floor(charT * count));
          const targetGlyph = glyphs[step];

          if (el.textContent !== targetGlyph) {
            el.textContent = targetGlyph;
            el.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
            el.style.fontVariantNumeric = "tabular-nums";
          }
        }
      }

      // Check completion
      if (progress >= 1) {
        restoreRealText();
        isRunningRef.current = false;
        isFastFinishingRef.current = false;
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }, [chars, durationMs, restoreRealText]);

  // -------------------------------------------------------------------------
  // Attach to parent button/link if directly nested
  // -------------------------------------------------------------------------

  useEffect(() => {
    const parent = wrapperRef.current?.parentElement;
    if (!parent) return;

    if (parent.tagName === "A" || parent.tagName === "BUTTON") {
      parent.addEventListener("pointerenter", handleTrigger);
      parent.addEventListener("pointerleave", handleLeave);
      parent.addEventListener("focus", handleTrigger);
      parent.addEventListener("blur", handleLeave);
      return () => {
        parent.removeEventListener("pointerenter", handleTrigger);
        parent.removeEventListener("pointerleave", handleLeave);
        parent.removeEventListener("focus", handleTrigger);
        parent.removeEventListener("blur", handleLeave);
      };
    }
  }, [handleTrigger, handleLeave]);

  // -------------------------------------------------------------------------
  // Unmount cleanup
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      restoreRealText();
    };
  }, [restoreRealText]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <span
      ref={wrapperRef}
      className={`inline-block ${className}`}
      onPointerEnter={handleTrigger}
      onPointerLeave={handleLeave}
      onFocus={handleTrigger}
      onBlur={handleLeave}
    >
      {/* Screen-reader accessible label */}
      <span className="sr-only">{text}</span>

      {/* Visual characters: at rest, inline spans with no width hacks or spacing alterations */}
      <span aria-hidden="true" style={{ pointerEvents: "none" }}>
        {chars.map((char, i) => (
          <span
            key={i}
            ref={(el) => {
              charRefs.current[i] = el;
            }}
          >
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}
