/**
 * AnimatedSpan — a span that fades/slides in after a delay.
 * Adapted from Magic UI for plain React / TanStack Start.
 */
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSpanProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onVisible?: () => void;
}

export function AnimatedSpan({ children, className, delay = 0, onVisible }: AnimatedSpanProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(true); onVisible?.(); }, delay);
    return () => clearTimeout(t);
  }, [delay, onVisible]);

  return (
    <span
      className={cn(
        "inline-block font-mono text-sm transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
        className
      )}
    >
      {visible ? children : null}
    </span>
  );
}
