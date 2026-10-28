import React, { useCallback, useEffect, useRef, useState } from "react";

// Timing constants (scaled with text length, capped between 1600ms and 2000ms)
const MIN_DURATION_MS = 1600;
const MAX_DURATION_MS = 2000;
const PER_CHAR_STAGGER_MS = 55; // 45-70ms per character
const FLICKER_INTERVAL_MS = 80; // 70-90ms per tick

// Character variety pools with balanced ~25% weighting per tick
const BINARY_POOL = "01";
const HEX_POOL = "0123456789ABCDEF";
const SYMBOL_POOL = "<>/{}[[]]#$%&*+=-_;:";
const ALPHA_POOL = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getRandomFlickerChar(): string {
  const category = Math.floor(Math.random() * 4);
  let pool: string;
  switch (category) {
    case 0:
      pool = BINARY_POOL;
      break;
    case 1:
      pool = HEX_POOL;
      break;
    case 2:
      pool = SYMBOL_POOL;
      break;
    default:
      pool = ALPHA_POOL;
      break;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface BinaryTextProps {
  text: string;
  className?: string;
  durationMs?: number;
}

/**
 * BinaryText - displays plain text, and on hover/focus decodes each character
 * from a varied flicker pool (binary, hex, symbols, letters) into the real character,
 * staggered left-to-right. Words are grouped as unbreakable units to prevent mid-word wrapping.
 */
export function BinaryText({
  text,
  className = "",
  durationMs,
}: BinaryTextProps) {
  const [displayChars, setDisplayChars] = useState<string[]>(() => text.split(""));
  const isRunningRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  const effectiveDuration =
    durationMs ??
    Math.min(
      MAX_DURATION_MS,
      Math.max(MIN_DURATION_MS, text.length * PER_CHAR_STAGGER_MS)
    );

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
      const progress = Math.min(elapsed / effectiveDuration, 1);

      const nextChars: string[] = [];
      let allSettled = true;

      for (let i = 0; i < length; i++) {
        const char = text[i];
        if (char === " " || char === "\n") {
          nextChars.push(char);
          continue;
        }

        // Left-to-right progressive settling
        const settleProgress = (i + 1) / length;
        if (progress >= settleProgress) {
          nextChars.push(char);
        } else {
          allSettled = false;
          nextChars.push(getRandomFlickerChar());
        }
      }

      setDisplayChars(nextChars);

      if (allSettled || progress >= 1) {
        stopAnimation();
      }
    }, FLICKER_INTERVAL_MS);
  }, [text, effectiveDuration, stopAnimation]);

  // Trigger when parent interactive element (button or link) is hovered or focused
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

  // Split into words while preserving character indices for unbreakable word wrapping
  const words: { word: string; startIndex: number }[] = [];
  let currentWord = "";
  let currentStart = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === " ") {
      if (currentWord.length > 0) {
        words.push({ word: currentWord, startIndex: currentStart });
        currentWord = "";
      }
      words.push({ word: " ", startIndex: i });
      currentStart = i + 1;
    } else {
      currentWord += char;
    }
  }
  if (currentWord.length > 0) {
    words.push({ word: currentWord, startIndex: currentStart });
  }

  return (
    <span
      ref={containerRef}
      className={`inline-block select-none ${className}`}
      onPointerEnter={triggerDecode}
      onFocus={triggerDecode}
      tabIndex={0}
      aria-label={text}
    >
      <span aria-hidden="true" className="inline">
        {words.map(({ word, startIndex }) => {
          if (word === " ") {
            return <span key={startIndex}> </span>;
          }
          return (
            <span key={startIndex} className="inline-block whitespace-nowrap">
              {word.split("").map((targetChar, offset) => {
                const charIndex = startIndex + offset;
                const currentChar = displayChars[charIndex] ?? targetChar;
                return (
                  <span key={charIndex} className="inline-block relative">
                    <span className="invisible select-none">{targetChar}</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      {currentChar}
                    </span>
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    </span>
  );
}
