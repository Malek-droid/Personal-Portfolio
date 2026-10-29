/**
 * TypingAnimation — types out text character by character.
 * Adapted from Magic UI (https://magicui.design) for plain React / TanStack Start.
 * No Next.js dependencies.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
  startOnView?: boolean;
  onComplete?: () => void;
}

export function TypingAnimation({
  children,
  className,
  duration = 100,
  delay = 0,
  as: Component = "span",
  startOnView = false,
  onComplete,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!startOnView) {
      const t = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(t);
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay, startOnView]);

  useEffect(() => {
    if (!started) return;
    if (displayedText === children) { onComplete?.(); return; }
    let i = 0;
    setDisplayedText("");
    const id = setInterval(() => {
      i++;
      setDisplayedText(children.slice(0, i));
      if (i >= children.length) {
        clearInterval(id);
        onComplete?.();
      }
    }, duration);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, children, duration]);

  return (
    <Component ref={ref} className={cn("text-sm font-mono", className)}>
      {displayedText}
    </Component>
  );
}
