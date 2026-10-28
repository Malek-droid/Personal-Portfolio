import { RefObject, useEffect } from "react";

/**
 * Tracks pointermove and writes --spot-x / --spot-y (viewport px) to the given
 * element so a CSS radial-gradient overlay can use them. RAF-throttled.
 * No-ops on coarse-pointer devices or when prefers-reduced-motion is set.
 */
export function useCursorSpotlight(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const el = ref.current;
    if (!el) return;

    let pending = false;

    const handlePointerMove = (e: PointerEvent) => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        el.style.setProperty("--spot-x", `${e.clientX}px`);
        el.style.setProperty("--spot-y", `${e.clientY}px`);
        pending = false;
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [ref]);
}
