import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/* ── Named constants ── */
export const RGB_BURST_DURATION_MS = 250;
export const RGB_OFFSET_PX = 3;
export const RGB_FILTER_ID = "rgb-split-filter";

interface ProjectThumbnailProps {
  title: string;
  tag: string;
  type: "hrcom" | "chrofa" | "driftMonitor" | "thinkboard" | "internshive" | "jobquest";
  className?: string;
}

export function ProjectThumbnail({ title, tag, type, className }: ProjectThumbnailProps) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const isBurstingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const triggerBurst = () => {
    // Only on fine-pointer devices, disabled under reduced motion
    const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFinePointer || isReduced) return;

    // No restart while a burst is already running
    if (isBurstingRef.current) return;
    const el = thumbRef.current;
    if (!el) return;

    isBurstingRef.current = true;
    el.setAttribute("data-glitching", "true");

    timerRef.current = setTimeout(() => {
      el.removeAttribute("data-glitching");
      isBurstingRef.current = false;
    }, RGB_BURST_DURATION_MS);
  };

  return (
    <div
      ref={thumbRef}
      onPointerEnter={triggerBurst}
      className={cn(
        "project-thumbnail w-full aspect-[16/9] mb-6 select-none cursor-pointer relative flex flex-col justify-between p-4",
        className
      )}
    >
      {/* Top window frame bar */}
      <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-2 z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff5f56] opacity-60" />
          <span className="w-2 h-2 rounded-full bg-[#ffbd2e] opacity-60" />
          <span className="w-2 h-2 rounded-full bg-[#27c93f] opacity-60" />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#555]">
          {title.toLowerCase()}.view
        </span>
      </div>

      {/* Visual content based on project type */}
      <div className="flex-1 flex items-center justify-center my-2 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#7c3aed 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        {type === "hrcom" && (
          <div className="w-full flex flex-col gap-1.5 px-3 font-mono text-[10px] text-[#888] relative z-10">
            <div className="flex items-center justify-between text-[#7c3aed]">
              <span>[AI_PIPELINE]</span>
              <span className="text-[9px]">Groq · LLaMA-3.1</span>
            </div>
            <div className="h-1.5 bg-[#1a1a1a] rounded overflow-hidden">
              <div className="w-[88%] h-full bg-[#7c3aed]" />
            </div>
            <div className="flex justify-between text-[9px] text-[#555]">
              <span>Embedding Score</span>
              <span>0.94 cosine</span>
            </div>
          </div>
        )}

        {type === "chrofa" && (
          <div className="w-full flex flex-col gap-1.5 px-3 font-mono text-[10px] text-[#888] relative z-10">
            <div className="flex items-center justify-between text-[#7c3aed]">
              <span>[AI_BOOKING_SAAS]</span>
              <span className="text-[9px] text-[#555]">Groq · Ollama</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px]">
              <span className="border border-[#222] bg-[#121212] px-2 py-1 text-[#aaa]">Slot Sync</span>
              <span className="border border-[#222] bg-[#121212] px-2 py-1 text-[#7c3aed]">WhatsApp · GCal</span>
            </div>
          </div>
        )}

        {type === "driftMonitor" && (
          <div className="w-full flex flex-col gap-1.5 px-3 font-mono text-[10px] text-[#888] relative z-10">
            <div className="flex items-center justify-between text-[#ffbd2e]">
              <span>[DRIFT_OBSERVABILITY]</span>
              <span className="text-[9px] text-[#555]">SciPy · Recharts</span>
            </div>
            <div className="bg-[#121212] border border-[#222] p-1.5 text-[9px] text-[#aaa] rounded flex justify-between">
              <code>KS-test (29 feat)</code>
              <span className="text-[#27c93f]">2-of-3 rule</span>
            </div>
          </div>
        )}

        {type === "thinkboard" && (
          <div className="w-full flex flex-col gap-1.5 px-3 font-mono text-[10px] text-[#888] relative z-10">
            <div className="flex items-center justify-between text-[#27c93f]">
              <span>[REST_SURFACE]</span>
              <span className="text-[9px] text-[#555]">Rate Limited</span>
            </div>
            <div className="bg-[#121212] border border-[#222] p-1.5 text-[9px] text-[#aaa] rounded">
              <code>GET /api/v1/notes 200 OK (38ms)</code>
            </div>
          </div>
        )}

        {type === "internshive" && (
          <div className="w-full flex flex-col gap-1.5 px-3 font-mono text-[10px] text-[#888] relative z-10">
            <div className="flex items-center justify-between text-[#ffbd2e]">
              <span>[AUTH + CRUD]</span>
              <span className="text-[9px] text-[#555]">SQLite</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px]">
              <span className="border border-[#222] bg-[#121212] px-2 py-1 text-[#aaa]">/internships</span>
              <span className="border border-[#222] bg-[#121212] px-2 py-1 text-[#7c3aed]">/apply</span>
            </div>
          </div>
        )}

        {type === "jobquest" && (
          <div className="w-full flex flex-col gap-1.5 px-3 font-mono text-[10px] text-[#888] relative z-10">
            <div className="flex items-center justify-between text-[#7c3aed]">
              <span>[NETWORK_FEED]</span>
              <span className="text-[9px] text-[#555]">Vanilla JS</span>
            </div>
            <div className="flex items-center gap-2 border border-[#222] bg-[#121212] p-1.5 rounded">
              <span className="w-4 h-4 rounded-full bg-[#7c3aed] flex items-center justify-center text-[8px] text-white font-bold">
                JQ
              </span>
              <span className="text-[9px] text-[#aaa] truncate">Interactive Profile · 100% solo</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom tag indicator */}
      <div className="flex items-center justify-between pt-1 border-t border-[#181818] z-10">
        <span className="font-mono text-[9px] text-[#666] uppercase tracking-wider">{tag}</span>
        <span className="font-mono text-[9px] text-[#7c3aed]">● preview</span>
      </div>
    </div>
  );
}

/**
 * Global hidden SVG definition containing the chromatic aberration filter.
 * Rendered ONCE at the application/page level.
 */
export function RgbSplitFilter() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
    >
      <defs>
        <filter id={RGB_FILTER_ID} x="-10%" y="-10%" width="120%" height="120%">
          {/* Isolate Red channel and offset by -N px */}
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="red"
          />
          <feOffset in="red" dx={-RGB_OFFSET_PX} dy="0" result="redOffset" />

          {/* Isolate Green channel and keep centered */}
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="green"
          />

          {/* Isolate Blue channel and offset by +N px */}
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="blue"
          />
          <feOffset in="blue" dx={RGB_OFFSET_PX} dy="0" result="blueOffset" />

          {/* Recombine channels using screen blending */}
          <feBlend in="redOffset" in2="green" mode="screen" result="rgBlend" />
          <feBlend in="rgBlend" in2="blueOffset" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}

