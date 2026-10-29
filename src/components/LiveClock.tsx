/**
 * LiveClock — displays the current time in Africa/Tunis timezone, ticking every second.
 * Hydration-safe: renders a placeholder until after mount to avoid SSR mismatch.
 * State lives only in this component.
 */
import { useEffect, useState } from "react";

/* ── Named constants ── */
const TIMEZONE = "Africa/Tunis";
const LOCALE   = "en-GB";
const TICK_MS  = 1000;
const PLACEHOLDER = "--:--:--";

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function LiveClock() {
  const [time, setTime] = useState<string>(PLACEHOLDER);

  useEffect(() => {
    setTime(formatTime(new Date()));
    const id = setInterval(() => setTime(formatTime(new Date())), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      suppressHydrationWarning
      style={{
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontVariantNumeric: "tabular-nums",
        fontSize: "11px",
        color: "#7c3aed",
        letterSpacing: "0.05em",
        minWidth: "6ch",
        display: "inline-block",
      }}
    >
      {time}
    </span>
  );
}

