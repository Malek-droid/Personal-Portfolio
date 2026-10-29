/**
 * BootSequence — first-visit terminal boot overlay.
 *
 * - Renders a fixed full-screen black overlay with a styled terminal.
 * - Only shown once per session (sessionStorage key BOOT_SESSION_KEY).
 * - Skippable via keypress, click, or tap.
 * - Fades out over FADE_DURATION_MS, then unmounts.
 * - Scroll is locked on body during the boot.
 * - SSR-safe: checks sessionStorage only after mount.
 * - prefers-reduced-motion: skips the boot entirely.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { TypingAnimation } from "@/components/ui/TypingAnimation";
import { AnimatedSpan } from "@/components/ui/AnimatedSpan";

/* ── Named constants ── */
const BOOT_SESSION_KEY = "malek_booted";
const FADE_DURATION_MS = 400;
const HOLD_DURATION_MS = 250;

const TYPING_TEXT = "> boot malek.dev";

const BOOT_LINES: Array<{ text: string; violet?: boolean; delay: number }> = [
  { text: "✔ loading modules",    delay: 1400 },
  { text: "✔ mounting interface", delay: 1800 },
  { text: "✔ access granted",     delay: 2200, violet: true },
];

/* ── Helpers ── */
function lockScroll()    { document.body.style.overflow = "hidden"; }
function unlockScroll()  { document.body.style.overflow = ""; }
function markBooted()    {
  try { sessionStorage.setItem(BOOT_SESSION_KEY, "1"); } catch { /* noop */ }
}
function removeBootingAttr() {
  document.documentElement.removeAttribute("data-booting");
}

/* ── Component ── */
export function BootSequence() {
  const [shouldRender, setShouldRender] = useState(false);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didExit = useRef(false);

  /* Determine on mount whether to show */
  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      removeBootingAttr();
      return;
    }
    // Already seen this session
    try {
      if (sessionStorage.getItem(BOOT_SESSION_KEY)) {
        removeBootingAttr();
        return;
      }
    } catch { /* noop */ }

    // Show overlay — remove data-booting now so body becomes visible (overlay covers it)
    removeBootingAttr();
    setShouldRender(true);
    lockScroll();
  }, []);

  /* Exit path: fade → unmount */
  const exit = useCallback(() => {
    if (didExit.current) return;
    didExit.current = true;
    markBooted();
    setFading(true);
    timerRef.current = setTimeout(() => {
      setShouldRender(false);
      unlockScroll();
    }, FADE_DURATION_MS);
  }, []);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      unlockScroll();
    };
  }, []);

  /* Skip on keydown / click / tap */
  useEffect(() => {
    if (!shouldRender) return;
    const onKey = () => exit();
    window.addEventListener("keydown", onKey, { once: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [shouldRender, exit]);

  /* Sequence complete: hold, then fade */
  const onSequenceComplete = useCallback(() => {
    timerRef.current = setTimeout(exit, HOLD_DURATION_MS);
  }, [exit]);

  if (!shouldRender) return null;

  // Body is now visible (overlay covers it), remove the hide attribute
  removeBootingAttr();

  return (
    <div
      role="status"
      aria-label="Portfolio boot sequence loading"
      onClick={exit}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_DURATION_MS}ms ease`,
        cursor: "pointer",
      }}
    >
      {/* Terminal window */}
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          backgroundColor: "#000",
          border: "1px solid rgba(124,58,237,0.3)",
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        }}
      >
        {/* Title bar — no macOS dots */}
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid rgba(124,58,237,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#444" }}>
            malek.dev — terminal
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 20px", minHeight: "140px" }}>
          {/* Typed first line */}
          <div style={{ marginBottom: "12px" }}>
            <TypingAnimation
              duration={60}
              delay={200}
              className="text-[#bbb]"
              onComplete={undefined}
            >
              {TYPING_TEXT}
            </TypingAnimation>
          </div>

          {/* AnimatedSpan lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {BOOT_LINES.map((line, i) => (
              <AnimatedSpan
                key={line.text}
                delay={line.delay}
                className={line.violet ? "text-[#7c3aed]" : "text-[#555]"}
                onVisible={i === BOOT_LINES.length - 1 ? onSequenceComplete : undefined}
              >
                {line.text}
              </AnimatedSpan>
            ))}
          </div>
        </div>
      </div>

      {/* Skip hint */}
      <p
        style={{
          marginTop: "20px",
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: "11px",
          color: "#333",
          letterSpacing: "0.05em",
          userSelect: "none",
        }}
      >
        press any key to skip
      </p>
    </div>
  );
}
