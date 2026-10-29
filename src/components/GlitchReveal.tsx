import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/* ── Named constants ── */
const TOTAL_REVEAL_MS = 800;
const CHAR_STAGGER_MS = 18;
const MIN_CYCLES = 1;
const MAX_CYCLES = 6;
const INTERSECTION_THRESHOLD = 0.15;

/**
 * Curated glitch glyphs from: ¡™£¢∞§¶•ªº–≠åß∂ƒ©˙∆˚¬…æ≈ç√∫˜µ≤≥÷/?░▒▓<>/
 * Dropped extra-wide / multi-column characters (…, æ, ░, ▒, ▓, ™) to preserve zero layout shift.
 */
const GLITCH_GLYPHS = [
  "¡", "£", "¢", "∞", "§", "¶", "•", "ª", "º", "–", "≠", "å", "ß",
  "∂", "ƒ", "©", "˙", "∆", "˚", "¬", "≈", "ç", "√", "∫", "˜", "µ",
  "≤", "≥", "÷", "/", "?", "<", ">",
] as const;

function getRandomGlyph(): string {
  const idx = Math.floor(Math.random() * GLITCH_GLYPHS.length);
  return GLITCH_GLYPHS[idx] ?? "/";
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface GlitchRevealProps {
  text: string;
  className?: string;
  delayMs?: number;
}

interface CharData {
  char: string;
  isSpace: boolean;
  style: CSSProperties;
}

export function GlitchReveal({ text, className, delayMs = 0 }: GlitchRevealProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check reduced motion once on mount
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Generate random CSS custom properties ONCE per character via useMemo
  const characters = useMemo<CharData[]>(() => {
    const chars = text.split("");
    const len = chars.length;

    return chars.map((ch, index) => {
      if (ch === " ") {
        return { char: " ", isSpace: true, style: {} };
      }

      const count = getRandomInt(MIN_CYCLES, MAX_CYCLES);
      const remainingTime = Math.max(120, TOTAL_REVEAL_MS - index * CHAR_STAGGER_MS);
      const cycleDuration = Math.max(50, Math.min(160, Math.floor(remainingTime / count)));
      const staggerDelay = index * CHAR_STAGGER_MS + delayMs;

      // Pick 10 random glitch glyphs for --char-0 ... --char-9
      const glyphs: Record<string, string> = {};
      for (let g = 0; g < 10; g++) {
        glyphs[`--char-${g}`] = JSON.stringify(getRandomGlyph());
      }

      const style: CSSProperties = {
        ...glyphs,
        ["--char-final" as any]: JSON.stringify(ch),
        ["--count" as any]: count,
        ["--duration" as any]: `${cycleDuration}ms`,
        ["--stagger-delay" as any]: `${staggerDelay}ms`,
      };

      return { char: ch, isSpace: false, style };
    });
  }, [text, delayMs]);

  // Trigger once when entering the viewport
  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            observer.disconnect(); // Unobserve after firing; never re-trigger
          }
        });
      },
      { threshold: INTERSECTION_THRESHOLD }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  // Settle to real text after animation completes
  useEffect(() => {
    if (!isRevealed || prefersReducedMotion) return;
    const totalTime = TOTAL_REVEAL_MS + text.length * CHAR_STAGGER_MS + delayMs + 60;
    const timer = setTimeout(() => {
      setIsSettled(true);
    }, totalTime);
    return () => clearTimeout(timer);
  }, [isRevealed, text.length, delayMs, prefersReducedMotion]);

  // Under prefers-reduced-motion render plain text with no animation
  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      ref={containerRef}
      role="text"
      aria-label={text}
      className={cn(
        "glitch-reveal-root",
        !isRevealed && "is-hidden",
        isRevealed && "is-revealed",
        isSettled && "is-settled",
        className
      )}
    >
      {characters.map((item, idx) => {
        if (item.isSpace) {
          return (
            <span key={idx} aria-hidden="true">
              {" "}
            </span>
          );
        }

        return (
          <span
            key={idx}
            className="glitch-char"
            style={item.style}
            aria-hidden="true"
          >
            <span className="glitch-char-real">{item.char}</span>
          </span>
        );
      })}
    </span>
  );
}
