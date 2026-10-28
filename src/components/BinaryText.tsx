import React, { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 600;
const FLICKER_INTERVAL_MS = 35;

export interface BinaryTextProps {
  text: string;
  className?: string;
  durationMs?: number;
}

/**
 * BinaryText - displays plain text, and on hover/focus decodes each character
 * from flickering binary (0/1) into the real character, staggered left-to-right.
 * Uses invisible placeholder characters to guarantee zero layout shift.
 * Respects prefers-reduced-motion and provides an accessible aria-label.
 */
export function BinaryText({
  text,
  className = "",
  durationMs = DEFAULT_DURATION_MS,
}: BinaryTextProps) {
  const [displayChars, setDisplayChars] = useState<string[]>(() => text.split(""));
  const isRunningRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Sync if text prop changes
  useEffect(() => {
    setDisplayChars(text.split(""));
  }, [text]);

  const stopAnimation = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    isRunningRef.current = false;
    setDisplayChars(text.split(""));
  }, [text]);

  const triggerDecode = useCallback(() => {
    if (isRunningRef.current) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    isRunningRef.current = true;
    const startTime = performance.now();
    const length = text.length;

    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      const nextChars: string[] = [];
      let allSettled = true;

      for (let i = 0; i < length; i++) {
        const char = text[i];
        if (char === " ") {
          nextChars.push(" ");
          continue;
        }

        // Left-to-right stagger: index i settles when progress reaches (i + 1) / length
        const settleProgress = (i + 1) / length;
        if (progress >= settleProgress) {
          nextChars.push(char);
        } else {
          allSettled = false;
          nextChars.push(Math.random() < 0.5 ? "0" : "1");
        }
      }

      setDisplayChars(nextChars);

      if (allSettled || progress >= 1) {
        stopAnimation();
      }
    }, FLICKER_INTERVAL_MS);
  }, [text, durationMs, stopAnimation]);

  // Hook up parent triggers (e.g. if rendered inside an <a> link)
  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    if (parent.tagName === "A" || parent.tagName === "BUTTON") {
      parent.addEventListener("pointerenter", triggerDecode);
      parent.addEventListener("focus", triggerDecode);
      return () => {
        parent.removeEventListener("pointerenter", triggerDecode);
        parent.removeEventListener("focus", triggerDecode);
      };
    }
  }, [triggerDecode]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <span
      ref={containerRef}
      className={`inline-block select-none ${className}`}
      onPointerEnter={triggerDecode}
      onFocus={triggerDecode}
      tabIndex={0}
      role="text"
      aria-label={text}
    >
      {text.split("").map((targetChar, index) => {
        const currentChar = displayChars[index] ?? targetChar;
        return (
          <span key={index} className="inline-block relative" aria-hidden="true">
            <span className="invisible select-none">{targetChar}</span>
            <span className="absolute inset-0 flex items-center justify-center">
              {currentChar}
            </span>
          </span>
        );
      })}
    </span>
  );
}
