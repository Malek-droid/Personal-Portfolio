import React, { useCallback, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Named constants — no magic numbers
// ---------------------------------------------------------------------------

/** Characters allowed inside the sweep window. Digits, A-F hex, symbols. No lowercase. */
const CHARSET = "0123456789ABCDEF<>/{} []#$%&*+=-;:";

/** Number of characters scrambling simultaneously as the window sweeps. */
const WINDOW_SIZE = 3;

/** Milliseconds between each one-character advance of the window. */
const WINDOW_ADVANCE_MS = 70;

/** Milliseconds between glyph changes for characters inside the window. */
const GLYPH_CHANGE_MS = 100;

/** Milliseconds to fade a newly settled character from SCRAMBLE_OPACITY to 1. */
const SETTLE_FADE_MS = 120;

/** Opacity applied to characters currently inside the sweep window. */
const SCRAMBLE_OPACITY = 0.55;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomGlyph(): string {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BinaryTextProps {
  text: string;
  className?: string;
  /** Unused — kept for call-site back-compat; has no effect on the new sweep animation. */
  durationMs?: number;
}

/**
 * BinaryText
 *
 * Renders plain text with a left-to-right sweep decode animation on
 * pointerenter / focus of the wrapper element.
 *
 * • Only a window of WINDOW_SIZE characters scrambles at a time.
 * • Characters behind the window show the real, settled text.
 * • Characters ahead of the window also show the real text (no pre-scramble).
 * • The window advances one position every WINDOW_ADVANCE_MS ms.
 * • Glyphs inside the window are randomised every GLYPH_CHANGE_MS ms.
 * • Each slot has a fixed width so nothing shifts during animation.
 * • New triggers are ignored while the animation is running.
 * • prefers-reduced-motion: renders plain text, no animation.
 * • Screen readers receive the real text via a visually-hidden element.
 */
export function BinaryText({
  text,
  className = "",
}: BinaryTextProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);

  // Per-slot DOM span refs for direct style/textContent mutation (avoids React re-renders).
  const slotRefs = useRef<HTMLSpanElement[]>([]);
  const isRunningRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // Ensure slot refs array is sized correctly on every render.
  const chars = text.split("");

  // -------------------------------------------------------------------------
  // Core animation — runs outside React state, mutates DOM directly.
  // -------------------------------------------------------------------------

  const runSweep = useCallback(() => {
    if (isRunningRef.current) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    isRunningRef.current = true;

    const slots = slotRefs.current;
    const length = chars.length;

    // Reset all slots to real text + full opacity before starting.
    for (let i = 0; i < length; i++) {
      const slot = slots[i];
      if (!slot) continue;
      slot.textContent = chars[i];
      slot.style.opacity = "1";
      slot.style.transition = "";
    }

    let windowStart = 0;
    let lastAdvanceTime = performance.now();
    let lastGlyphTime = performance.now();

    function tick(now: number) {
      // --- Advance window? ---
      if (now - lastAdvanceTime >= WINDOW_ADVANCE_MS) {
        // Settle the character leaving the back of the window.
        const leavingIndex = windowStart - 1;
        if (leavingIndex >= 0 && leavingIndex < length) {
          const leavingSlot = slots[leavingIndex];
          if (leavingSlot) {
            leavingSlot.textContent = chars[leavingIndex];
            leavingSlot.style.transition = `opacity ${SETTLE_FADE_MS}ms ease`;
            leavingSlot.style.opacity = "1";
          }
        }
        windowStart += 1;
        lastAdvanceTime = now;
      }

      // --- Randomise glyphs inside the window? ---
      if (now - lastGlyphTime >= GLYPH_CHANGE_MS) {
        for (let i = windowStart; i < Math.min(windowStart + WINDOW_SIZE, length); i++) {
          const slot = slots[i];
          if (!slot) continue;
          // Skip whitespace — keep it as-is.
          if (chars[i] === " ") continue;
          slot.textContent = randomGlyph();
          slot.style.transition = "";
          slot.style.opacity = String(SCRAMBLE_OPACITY);
        }
        lastGlyphTime = now;
      }

      // --- Done? ---
      if (windowStart >= length) {
        // Settle any remaining chars in the last window.
        for (let i = Math.max(0, length - WINDOW_SIZE); i < length; i++) {
          const slot = slots[i];
          if (!slot) continue;
          slot.textContent = chars[i];
          slot.style.transition = `opacity ${SETTLE_FADE_MS}ms ease`;
          slot.style.opacity = "1";
        }
        isRunningRef.current = false;
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }, [chars, text]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <span
      ref={wrapperRef}
      className={`inline-block ${className}`}
      onPointerEnter={runSweep}
      onFocus={runSweep}
    >
      {/* Screen-reader text — hidden visually, readable by AT */}
      <span className="sr-only">{text}</span>

      {/* Visual slots — aria-hidden so AT uses the sr-only span above */}
      <span aria-hidden="true" className="inline" style={{ pointerEvents: "none" }}>
        {chars.map((char, i) => {
          if (char === " ") {
            return (
              <span
                key={i}
                style={{ display: "inline-block", minWidth: "0.3ch" }}
              >
                {" "}
              </span>
            );
          }
          return (
            <span
              key={i}
              style={{ display: "inline-block", minWidth: "1ch", textAlign: "center" }}
              ref={(el) => {
                if (el) slotRefs.current[i] = el;
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}
