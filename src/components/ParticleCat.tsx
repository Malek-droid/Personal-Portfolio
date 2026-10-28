import React, { useEffect, useRef, useState } from "react";
import { initParticleCat, isWebGLAvailable } from "@/lib/cat-particles";

/**
 * ParticleCat - client-only Three.js particle silhouette of a cat.
 * Features violet drifting particles, two glowing eyes, and cursor scatter interaction.
 * Gracefully degrades to static SVG if WebGL is unavailable or SSR.
 */
export function ParticleCat() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { dispose } = initParticleCat(container, { isReducedMotion });

    return () => {
      dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="cat-wrap relative flex items-center justify-center overflow-visible"
      style={{ width: "220px", height: "275px", maxWidth: "60vw" }}
      aria-label="Interactive particle cat silhouette"
      role="img"
    >
      {(!mounted || !hasWebGL) && (
        <img
          src="/cat-photo.png"
          alt="Cat portrait"
          className="w-full h-full object-contain opacity-60"
        />
      )}
    </div>
  );
}
