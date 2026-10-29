import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { useCursorSpotlight } from "@/hooks/useCursorSpotlight";
import { BinaryText } from "@/components/BinaryText";
import { CommandTerminal } from "@/components/CommandTerminal";
import { useCommandTerminalShortcut } from "@/hooks/useCommandTerminalShortcut";
import { LiveClock as FooterClock } from "@/components/LiveClock";
import { GitHubCalendar } from "@/components/GitHubCalendar";
import { GitHubActivityTable } from "@/components/GitHubActivityTable";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { GlitchReveal } from "@/components/GlitchReveal";
import { ProjectThumbnail, RgbSplitFilter } from "@/components/ProjectThumbnail";
import {
  useScroll,
  useTransform,
  motion,
  type MotionValue,
} from "motion/react";

export const PROJECT_LINKS = {
  hrcom: "#",       // original was href="#" — restored
  chrofa: "",       // new project, no URL yet
  driftMonitor: "", // new project, no URL yet
  thinkboard: "#",  // original was href="#" — restored
  internshive: "#", // original was href="#" — restored
  jobquest: "#",    // original was href="#" — restored
};

export const CV_FILE_PATH = "#"; // original was href="#" — restored

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Malek Ben Salah — AI-Driven Full-Stack Developer" },
      { name: "description", content: "Software Engineering graduate and Master's student building full-stack platforms with applied AI. Open to part-time, internship and freelance work." },
      { property: "og:title", content: "Malek Ben Salah — AI-Driven Full-Stack Developer" },
      { property: "og:description", content: "Software Engineering graduate and Master's student building full-stack platforms with applied AI. Open to part-time, internship and freelance work." },
    ],
  }),
  component: Index,
});

/* ---------- Reveal hook ---------- */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ---------- Components ---------- */
const SectionTag = ({
  children,
  delay = 0,
  num,
  darkPill = false,
}: {
  children: React.ReactNode;
  delay?: number;
  num?: string;
  darkPill?: boolean;
}) => {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal flex items-center gap-2 text-[11px] font-mono tracking-[0.25em] uppercase mb-6 ${
        darkPill ? "text-purple-200" : "text-[#777]"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span
        className={`inline-block w-2 h-2 ${
          darkPill ? "bg-white" : "bg-[#7c3aed]"
        }`}
      />
      {num ? (
        <span className={darkPill ? "text-white font-bold" : "text-[#7c3aed] font-semibold"}>
          {num} //
        </span>
      ) : null}
      {typeof children === "string" ? <BinaryText text={children} /> : children}
    </div>
  );
};

const CrosshairCorners = () => (
  <>
    <span className="crosshair top-1 left-1.5" aria-hidden="true">+</span>
    <span className="crosshair top-1 right-1.5" aria-hidden="true">+</span>
    <span className="crosshair bottom-1 left-1.5" aria-hidden="true">+</span>
    <span className="crosshair bottom-1 right-1.5" aria-hidden="true">+</span>
  </>
);

const Heading = ({ a, b }: { a: string; b: string }) => {
  return (
    <h2 className="font-black text-4xl md:text-6xl leading-[1.05] tracking-tight">
      <span className="block text-white"><GlitchReveal text={a} delayMs={100} /></span>
      <span className="block text-[#555]"><GlitchReveal text={b} delayMs={200} /></span>
    </h2>
  );
};

function FilledBtn({ children, href = "#" }: { children: string; href?: string }) {
  return (
    <a href={href} className="btn-filled">
      <span className="btn-label"><BinaryText text={children} /></span>
      <span className="btn-arrow">↗</span>
    </a>
  );
}

const GhostBtn = ({ children, href = "#" }: { children: React.ReactNode; href?: string }) => (
  <a href={href} className="btn-ghost">
    {typeof children === "string" ? <BinaryText text={children} /> : children}
  </a>
);

const Terminal = ({
  title,
  lines,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ariaLabel,
}: {
  title: string;
  lines: { t: string; c?: string }[];
  onClick?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  role?: string;
  tabIndex?: number;
  ariaLabel?: string;
}) => (
  <div
    className={`bg-[#0d0d0d] border border-[#222] relative ${onClick ? "cursor-pointer" : ""}`}
    onClick={onClick}
    onKeyDown={onKeyDown}
    role={role}
    tabIndex={tabIndex}
    aria-label={ariaLabel}
  >
    <div className="flex items-center px-4 py-3 border-b border-[#1e1e1e] relative">
      <div className="flex gap-2">
        <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-mono uppercase tracking-[0.2em] text-[#555] pointer-events-none">
        {title}
      </div>
    </div>
    <div className="p-5 font-mono text-[13px] leading-relaxed">
      {lines.map((l, i) => (
        <div key={i} className={l.c ?? "text-white"}>{l.t}</div>
      ))}
    </div>
    <div className="dot-line mx-5 mb-5" />
  </div>
);

/* Ambient terminal bg */
const AmbientBg = ({ text }: { text: string }) => {
  const block = (text + "\n").repeat(20);
  return (
    <div className="ambient-bg">
      <div className="ambient-bg-inner">
        {block}
        {block}
      </div>
    </div>
  );
};

const HERO_AMBIENT = `$ deploy --env production
▸ building bundle... ok
▸ uploading 247 assets to edge
▸ warming inference cache
✓ deployed in 1.4s
$ git push origin main
remote: pipeline triggered
$ curl -X POST https://api.malek.dev/agent
{ "status": "ok", "latency_ms": 38 }
$ docker compose up -d
$ pnpm test --watch
PASS  src/lib/agent.test.ts
PASS  src/routes/index.test.tsx`;

const PROJ_AMBIENT = `commit a3f9c21 feat(agent): streaming inference
commit 8b1d4e0 fix(api): retry on 502
commit 27ccaa9 chore: bump deps
commit 1ee5f7b refactor(db): index hot path
$ git log --oneline -n 10
$ gh pr create --title "feat: rag pipeline v2"
> Branch: feat/rag-v2
> Reviewers: @maya @daniel
✓ pull request #482 opened`;

const ABOUT_AMBIENT = `import { ship } from "@/lib/principles"
const values = ["types", "tests", "telemetry"]
export const me = { focus: "ai+product", since: 2017 }
function build(idea) { return ship(idea) }
// boring tech, exciting outcomes`;

const SKILLS_AMBIENT = `import React from "react"
import { z } from "zod"
import OpenAI from "openai"
import { drizzle } from "drizzle-orm"
import { createClient } from "@supabase/supabase-js"
import express from "express"
import { defineConfig } from "vite"`;

/* Animated number */
function StatNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const start = performance.now();
          const dur = 1500;
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            setN(Math.round(eased * value));
            if (t < 1) requestAnimationFrame(tick);
            else setDone(true);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <div ref={ref} className="font-black text-5xl md:text-6xl text-white">{n}{done ? suffix : ""}</div>;
}

/* Cursor glow */
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return <div ref={ref} className="cursor-glow" />;
}

/* Flashlight cursor overlay */
function FlashlightSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useCursorSpotlight(ref);
  return <div ref={ref} className="spotlight-overlay" aria-hidden="true" />;
}

/* Reveal wrapper */
const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useReveal<HTMLDivElement>();
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
};

/* ---------- Window panel (mini top-bar shell) ---------- */
const WindowPanel = ({ label, tag, children, className = "" }: { label: string; tag?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={`relative bg-[#0a0a0a] border border-[#1e1e1e] hover:border-dashed-purple transition-colors ${className}`}>
    <CrosshairCorners />
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="win-dot bg-[#ff5f56]" />
          <span className="win-dot bg-[#ffbd2e]" />
          <span className="win-dot bg-[#27c93f]" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#666]"><BinaryText text={label} /></span>
      </div>
      {tag && <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#555]">{tag}</div>}
    </div>
    {children}
  </div>
);

/* ---------- 1. Request-Path diagram (scroll-driven) ---------- */

/* ── Named constants ── */
const DIAGRAM_SECTION_HEIGHT = "300vh";

const THRESHOLD_NODE_0 = 0.08;
const THRESHOLD_LINE_1_START = 0.12;
const THRESHOLD_LINE_1_END = 0.42;
const THRESHOLD_NODE_1 = 0.42;
const THRESHOLD_LINE_2_START = 0.48;
const THRESHOLD_LINE_2_END = 0.78;
const THRESHOLD_NODE_2 = 0.78;

const STACK_BADGES = ["React", "Node", "Mongo", "Groq", "JWT", "+N"] as const;

const CatMark = ({ strokeColor = "#7c3aed" }: { strokeColor?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke={strokeColor}
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mx-auto mb-2 transition-colors duration-300"
  >
    <path d="M5 8 L7 3 L10 7" />
    <path d="M19 8 L17 3 L14 7" />
    <path d="M6 13 C6 9.5 8.5 7.5 12 7.5 C15.5 7.5 18 9.5 18 13 C18 16.5 15.5 19 12 19 C8.5 19 6 16.5 6 13 Z" />
    <circle cx="9.8" cy="12.2" r="0.6" fill={strokeColor} stroke="none" />
    <circle cx="14.2" cy="12.2" r="0.6" fill={strokeColor} stroke="none" />
    <path d="M11.4 14.2 L12 15 L12.6 14.2" />
    <path d="M7.5 13 L5 12.5 M7.5 13.8 L5 14.4" />
    <path d="M16.5 13 L19 12.5 M16.5 13.8 L19 14.4" />
  </svg>
);

function HorizontalConnector({
  progress,
  isLit,
}: {
  progress: MotionValue<number>;
  isLit: boolean;
}) {
  const rawId = useId();
  const maskId = `mask-h-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="hidden md:flex flex-col items-center justify-center gap-2 px-2 w-full">
      <span
        className="text-[9px] font-mono tracking-[0.15em] transition-colors duration-300"
        style={{ color: isLit ? "#7c3aed" : "#444" }}
      >
        ⚡ SHIPPED
      </span>
      <div className="w-full h-4 relative flex items-center">
        <svg
          className="w-full h-4 overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 16"
        >
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="16">
              <motion.line
                x1="0"
                y1="8"
                x2="100"
                y2="8"
                stroke="white"
                strokeWidth="12"
                strokeLinecap="butt"
                style={{ pathLength: progress }}
              />
            </mask>
          </defs>
          {/* Dim background dots */}
          <line
            x1="0"
            y1="8"
            x2="100"
            y2="8"
            stroke="#262626"
            strokeWidth="2"
            strokeDasharray="4 6"
          />
          {/* Lit violet dots revealed by scroll mask */}
          <line
            x1="0"
            y1="8"
            x2="100"
            y2="8"
            stroke="#7c3aed"
            strokeWidth="2"
            strokeDasharray="4 6"
            mask={`url(#${maskId})`}
          />
        </svg>
      </div>
    </div>
  );
}

function VerticalConnector({
  progress,
  isLit,
}: {
  progress: MotionValue<number>;
  isLit: boolean;
}) {
  const rawId = useId();
  const maskId = `mask-v-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="flex md:hidden flex-col items-center justify-center gap-1 my-1">
      <span
        className="text-[9px] font-mono tracking-[0.15em] transition-colors duration-300"
        style={{ color: isLit ? "#7c3aed" : "#444" }}
      >
        ⚡ SHIPPED
      </span>
      <div className="w-6 h-10 relative flex justify-center">
        <svg className="w-6 h-10 overflow-visible" viewBox="0 0 24 40">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="40">
              <motion.line
                x1="12"
                y1="0"
                x2="12"
                y2="40"
                stroke="white"
                strokeWidth="12"
                strokeLinecap="butt"
                style={{ pathLength: progress }}
              />
            </mask>
          </defs>
          {/* Dim background dots */}
          <line
            x1="12"
            y1="0"
            x2="12"
            y2="40"
            stroke="#262626"
            strokeWidth="2"
            strokeDasharray="4 6"
          />
          {/* Lit violet dots revealed by scroll mask */}
          <line
            x1="12"
            y1="0"
            x2="12"
            y2="40"
            stroke="#7c3aed"
            strokeWidth="2"
            strokeDasharray="4 6"
            mask={`url(#${maskId})`}
          />
        </svg>
      </div>
    </div>
  );
}

const RequestPath = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const line1Progress = useTransform(
    scrollYProgress,
    [THRESHOLD_LINE_1_START, THRESHOLD_LINE_1_END],
    [0, 1],
    { clamp: true }
  );

  const line2Progress = useTransform(
    scrollYProgress,
    [THRESHOLD_LINE_2_START, THRESHOLD_LINE_2_END],
    [0, 1],
    { clamp: true }
  );

  useEffect(() => {
    if (prefersReducedMotion) return;
    return scrollYProgress.on("change", (v) => {
      let nextStep = -1;
      if (v >= THRESHOLD_NODE_2) {
        nextStep = 2;
      } else if (v >= THRESHOLD_NODE_1) {
        nextStep = 1;
      } else if (v >= THRESHOLD_NODE_0) {
        nextStep = 0;
      }
      setActiveStep((prev) => (prev !== nextStep ? nextStep : prev));
    });
  }, [scrollYProgress, prefersReducedMotion]);

  const isLit0 = prefersReducedMotion || activeStep >= 0;
  const isLit1 = prefersReducedMotion || activeStep >= 1;
  const isLit2 = prefersReducedMotion || activeStep >= 2;

  const diagramContent = (
    <WindowPanel
      label="REQUEST-PATH"
      tag={
        <span className={`transition-colors duration-300 ${isLit2 ? "text-[#7c3aed]" : "text-[#555]"}`}>
          🔒 end-to-end
        </span>
      }
    >
      <div className="p-6 md:p-10">
        <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(60px,2fr)_minmax(0,1.1fr)_minmax(60px,2fr)_minmax(0,1fr)] items-center gap-2 md:gap-4">
          {/* Node 0: Concept */}
          <div
            className={`w-full max-w-xs md:max-w-none border p-5 text-center transition-all duration-500 ${
              isLit0
                ? "border-[#7c3aed] bg-[#0d0d0d] shadow-[0_0_24px_rgba(124,58,237,0.2)]"
                : "border-[#1e1e1e] bg-[#0a0a0a]"
            }`}
          >
            <div
              className={`text-xl mb-2 transition-colors duration-300 ${
                isLit0 ? "text-[#7c3aed]" : "text-[#444]"
              }`}
            >
              ◆
            </div>
            <div
              className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                isLit0 ? "text-[#888]" : "text-[#444]"
              }`}
            >
              Your Idea
            </div>
            <div
              className={`text-sm font-bold mt-1 transition-colors duration-300 ${
                isLit0 ? "text-white" : "text-[#666]"
              }`}
            >
              Concept
            </div>
          </div>

          {/* Line 1 (Horizontal for md+, Vertical for <md) */}
          {prefersReducedMotion ? (
            <>
              <div className="hidden md:flex flex-col items-center justify-center gap-2 px-2 w-full">
                <span className="text-[9px] font-mono tracking-[0.15em] text-[#7c3aed]">
                  ⚡ SHIPPED
                </span>
                <div className="w-full h-4 relative flex items-center">
                  <svg className="w-full h-4 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 16">
                    <line x1="0" y1="8" x2="100" y2="8" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 6" />
                  </svg>
                </div>
              </div>
              <div className="flex md:hidden flex-col items-center justify-center gap-1 my-1">
                <span className="text-[9px] font-mono tracking-[0.15em] text-[#7c3aed]">
                  ⚡ SHIPPED
                </span>
                <div className="w-6 h-10 relative flex justify-center">
                  <svg className="w-6 h-10 overflow-visible" viewBox="0 0 24 40">
                    <line x1="12" y1="0" x2="12" y2="40" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 6" />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <>
              <HorizontalConnector progress={line1Progress} isLit={isLit1} />
              <VerticalConnector progress={line1Progress} isLit={isLit1} />
            </>
          )}

          {/* Node 1: Full-stack build */}
          <div
            className={`w-full max-w-xs md:max-w-none border p-5 text-center relative transition-all duration-500 ${
              isLit1
                ? "border-[#7c3aed] bg-[#0d0d0d] shadow-[0_0_28px_rgba(124,58,237,0.25)]"
                : "border-[#1e1e1e] bg-[#0a0a0a]"
            }`}
          >
            <CatMark strokeColor={isLit1 ? "#7c3aed" : "#444"} />
            <div
              className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                isLit1 ? "text-[#7c3aed]" : "text-[#444]"
              }`}
            >
              MALEK
            </div>
            <div
              className={`text-sm font-bold mt-1 transition-colors duration-300 ${
                isLit1 ? "text-white" : "text-[#666]"
              }`}
            >
              Full-stack build
            </div>
          </div>

          {/* Line 2 (Horizontal for md+, Vertical for <md) */}
          {prefersReducedMotion ? (
            <>
              <div className="hidden md:flex flex-col items-center justify-center gap-2 px-2 w-full">
                <span className="text-[9px] font-mono tracking-[0.15em] text-[#7c3aed]">
                  ⚡ SHIPPED
                </span>
                <div className="w-full h-4 relative flex items-center">
                  <svg className="w-full h-4 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 16">
                    <line x1="0" y1="8" x2="100" y2="8" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 6" />
                  </svg>
                </div>
              </div>
              <div className="flex md:hidden flex-col items-center justify-center gap-1 my-1">
                <span className="text-[9px] font-mono tracking-[0.15em] text-[#7c3aed]">
                  ⚡ SHIPPED
                </span>
                <div className="w-6 h-10 relative flex justify-center">
                  <svg className="w-6 h-10 overflow-visible" viewBox="0 0 24 40">
                    <line x1="12" y1="0" x2="12" y2="40" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 6" />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <>
              <HorizontalConnector progress={line2Progress} isLit={isLit2} />
              <VerticalConnector progress={line2Progress} isLit={isLit2} />
            </>
          )}

          {/* Node 2: Stack */}
          <div
            className={`w-full max-w-xs md:max-w-none border p-5 text-center transition-all duration-500 ${
              isLit2
                ? "border-[#7c3aed] bg-[#0d0d0d] shadow-[0_0_24px_rgba(124,58,237,0.2)]"
                : "border-[#1e1e1e] bg-[#0a0a0a]"
            }`}
          >
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {STACK_BADGES.map((s) => (
                <span
                  key={s}
                  className={`text-[9px] font-mono border py-1 transition-colors duration-300 ${
                    isLit2
                      ? "text-[#ccc] border-[#33224d] bg-[#120a1f]"
                      : "text-[#555] border-[#1a1a1a] bg-transparent"
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
            <div
              className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                isLit2 ? "text-[#7c3aed]" : "text-[#444]"
              }`}
            >
              Every Stack
            </div>
          </div>
        </div>

        <div
          className={`text-center mt-8 font-mono text-[11px] uppercase tracking-[0.3em] transition-colors duration-300 ${
            isLit2 ? "text-[#888]" : "text-[#444]"
          }`}
        >
          IDEA · CODE · PRODUCTION — SHIPPED END TO END
        </div>
      </div>
    </WindowPanel>
  );

  /* prefers-reduced-motion: no pinning, no scroll animation. Show the final, fully lit diagram in normal flow. */
  if (prefersReducedMotion) {
    return (
      <section className="border-b border-[#1a1a1a] bg-black py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          {diagramContent}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-[#1a1a1a] bg-black"
      style={{ height: DIAGRAM_SECTION_HEIGHT }}
    >
      <div className="sticky top-0 h-screen w-full flex items-center justify-center p-4 md:p-6 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {diagramContent}
        </div>
      </div>
    </section>
  );
};

/* ---------- 2. Benchmark chart ---------- */
const Benchmark = () => (
  <section className="border-b border-[#1a1a1a] py-32">
    <div className="max-w-7xl mx-auto px-6">
      <SectionTag num="04">By the numbers</SectionTag>
      <Heading a="Real numbers." b="No filler." />
      <div className="grid md:grid-cols-2 gap-4 mt-16">
        <Reveal delay={200}>
          <WindowPanel label="scale" tag="[ FIG.01 ]">
            <div className="p-6 divide-y divide-[#1a1a1a]">
              <div className="py-3 font-mono text-[12px] leading-relaxed">
                <span className="text-[#7c3aed] font-bold">HRcoM:</span>{" "}
                <span className="text-[#ccc]">50+ REST endpoints · 16+ modules</span>
              </div>
              <div className="py-3 font-mono text-[12px] leading-relaxed">
                <span className="text-[#7c3aed] font-bold">AI Model Drift Monitor:</span>{" "}
                <span className="text-[#ccc]">284,807 transactions · 29 features tested · 5 validation scenarios</span>
              </div>
              <div className="py-3 font-mono text-[12px] leading-relaxed">
                <span className="text-[#7c3aed] font-bold">CHROFA:</span>{" "}
                <span className="text-[#ccc]">AI booking · email + WhatsApp + Google Calendar integrations</span>
              </div>
            </div>
          </WindowPanel>
        </Reveal>
        <Reveal delay={350}>
          <WindowPanel label="quality-checks" tag="[ FIG.02 ]">
            <div className="p-6 divide-y divide-[#1a1a1a]">
              <div className="py-3 font-mono text-[12px] leading-relaxed">
                <span className="text-[#7c3aed] font-bold">HRcoM:</span>{" "}
                <span className="text-[#ccc]">unit, integration and E2E tests (Jest, Playwright)</span>
              </div>
              <div className="py-3 font-mono text-[12px] leading-relaxed">
                <span className="text-[#7c3aed] font-bold">AI Model Drift Monitor:</span>{" "}
                <span className="text-[#ccc]">35-point dashboard contract check · 10-point scientific audit</span>
              </div>
              <div className="py-3 font-mono text-[12px] leading-relaxed">
                <span className="text-[#7c3aed] font-bold">CHROFA:</span>{" "}
                <span className="text-[#ccc]">Zod validation · rate limiting · NoSQL injection protection</span>
              </div>
            </div>
          </WindowPanel>
        </Reveal>
      </div>
    </div>
  </section>
);

/* ---------- 3. Multi-module selector ---------- */
function ModuleSelector() {
  const [tab, setTab] = useState<"modules" | "stack">("modules");
  const modules = [
    { i: "◉", n: "Facial Recognition Attendance", s: "face-api.js" },
    { i: "◆", n: "AI CV Ranking", s: "Groq LLaMA 3.1 + embeddings" },
    { i: "▣", n: "Leave Management", s: "approval workflow" },
    { i: "◈", n: "Real-Time Notifications", s: "socket.io" },
    { i: "▲", n: "RBAC", s: "role-based access control" },
    { i: "▼", n: "Audit Logs", s: "tamper-evident trail" },
    { i: "■", n: "Report Generation", s: "puppeteer + exceljs" },
  ];
  const stack = [
    { i: "◉", n: "React + TypeScript", s: "frontend" },
    { i: "◆", n: "Node.js + Express", s: "backend" },
    { i: "▣", n: "MongoDB + Mongoose", s: "database" },
    { i: "◈", n: "Socket.io", s: "realtime" },
    { i: "▲", n: "JWT + bcrypt", s: "auth" },
    { i: "▼", n: "Jest + Playwright", s: "testing" },
    { i: "■", n: "Swagger / OpenAPI", s: "api docs" },
  ];
  const rows = tab === "modules" ? modules : stack;
  return (
    <WindowPanel label="hrcom.config" tag={<span><span className="text-[#7c3aed]">{rows.length}+</span> SELECTED</span>}>
      <div className="flex border-b border-[#1e1e1e]">
        {(["modules","stack"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-[11px] font-mono uppercase tracking-[0.2em] transition-colors ${tab===t ? "text-white border-b-2 border-[#7c3aed]" : "text-[#555] hover:text-white"}`}>
            {t === "modules" ? <BinaryText text="Modules" /> : <BinaryText text="Tech Stack" />}
          </button>
        ))}
      </div>
      <div className="divide-y divide-[#1a1a1a]">
        {rows.map(r => (
          <div key={r.n} className="flex items-center gap-4 px-5 py-3 hover:bg-[#0d0d0d] transition-colors">
            <span className="text-[#7c3aed] text-base w-5 text-center">{r.i}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[13px] font-medium truncate"><BinaryText text={r.n} /></div>
              <div className="font-mono text-[10px] text-[#555] uppercase tracking-wider"><BinaryText text={r.s} /></div>
            </div>
            <div className="toggle" />
          </div>
        ))}
      </div>
    </WindowPanel>
  );
}

/* ---------- 4. AI Toolkit ---------- */
const AI_TOOLKIT = [
  {
    f: "llm/integration.ts",
    n: "LLM Integration",
    c: [
      "// Groq (LLaMA 3.3 70B) + local Ollama",
      "const res = await groq.chat",
      "  .completions.create({",
      "    model: 'llama-3.3-70b',",
      "    messages: [{ role:'user',",
      "      content: prompt }],",
      "  });",
    ],
    usedIn: "HRcoM · CHROFA",
  },
  {
    f: "ai/embeddings.ts",
    n: "Vector Embeddings",
    c: [
      "const v1 = await embed(cv);",
      "const v2 = await embed(job);",
      "const score = cosine(v1, v2);",
      "return rank(score);",
    ],
    usedIn: "HRcoM",
  },
  {
    f: "ai/vision.ts",
    n: "Computer Vision",
    c: [
      "const det = await faceapi",
      "  .detectAllFaces(img)",
      "  .withFaceLandmarks()",
      "  .withFaceDescriptors();",
      "return match(det, known);",
    ],
    usedIn: "HRcoM",
  },
  {
    f: "ai/prompting.ts",
    n: "Prompt Engineering",
    c: [
      "const prompt = `",
      "Role: HR analyst.",
      "Task: Score CV vs role.",
      "Context: ${role}",
      "Input: ${cv}",
      "Output: JSON { score, why }`;",
    ],
    usedIn: "HRcoM · CHROFA",
  },
  {
    f: "ai/automation.ts",
    n: "AI-Assisted Workflows",
    c: [
      "const ranked = candidates",
      "  .map(scoreWithLLM)",
      "  .sort((a,b) => b.s - a.s);",
      "await notify(ranked.slice(0,5));",
    ],
    usedIn: "HRcoM · CHROFA",
  },
  {
    f: "ml/drift.py",
    n: "Statistical Monitoring",
    c: [
      "# KS-test data drift & concept drift",
      "ks_stat, p_val = ks_2samp(ref, curr)",
      "data_drift = p_val < 0.05",
      "consensus = sum([",
      "  recall_drop, f1_drop, roc_drop",
      "]) >= 2",
    ],
    usedIn: "AI Model Drift Monitor",
  },
];
const UnderTheHood = () => (
  <section className="border-b border-[#1a1a1a] py-32">
    <div className="max-w-7xl mx-auto px-6">
      <SectionTag num="06">AI Toolkit</SectionTag>
      <Heading a="AI isn't a feature." b="It's how I build." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-16">
        {AI_TOOLKIT.map((p, i) => (
          <Reveal key={p.f} delay={200 + i * 100}>
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] h-full flex flex-col justify-between">
              <div>
                <div className="px-3 py-2 border-b border-[#1e1e1e] font-mono text-[10px] text-[#666] truncate"><BinaryText text={p.f} /></div>
                <div className="p-4 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#7c3aed] mb-3 font-mono"><BinaryText text={`▪ ${p.n}`} /></div>
                  <pre className="font-mono text-[11px] text-[#999] leading-relaxed whitespace-pre-wrap">{p.c.join("\n")}</pre>
                </div>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-[#1a1a1a] flex items-center justify-between font-mono text-[10px]">
                <span className="text-[#555] uppercase tracking-wider">Used in:</span>
                <span className="text-[#7c3aed] font-medium"><BinaryText text={p.usedIn} /></span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="text-center mt-10 font-mono text-[11px] uppercase tracking-[0.3em] text-[#555]">
        APPLIED ACROSS EVERY PROJECT — NOT JUST ONE
      </div>
    </div>
  </section>
);



/* ---------- 5. System status dashboard ---------- */
function LiveClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    setT(new Date().toUTCString().slice(17, 25));
    const id = setInterval(() => setT(new Date().toUTCString().slice(17, 25)), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-[11px] text-[#7c3aed]" suppressHydrationWarning>{t || "--:--:--"} UTC</span>;
}
const Sparkline = ({ seed = 0 }: { seed?: number }) => {
  const pts = Array.from({ length: 20 }, (_, i) => {
    const x = i * 6;
    const y = 12 + Math.sin(i * 0.7 + seed) * 6 + (i % 3) * 1.5;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg className="spark" width="120" height="24" viewBox="0 0 120 24">
      <polyline points={pts} fill="none" stroke="#7c3aed" strokeWidth="1.3" />
    </svg>
  );
};
const SystemStatus = () => (
  <section className="border-b border-[#1a1a1a] py-32">
    <div className="max-w-7xl mx-auto px-6">
      <SectionTag num="03">System status</SectionTag>
      <Heading a="Always learning." b="Always shipping." />
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-[#666]">
        <span><span className="text-white">6</span> Projects Built</span>
        <span className="text-[#1e1e1e]">·</span>
        <span>Last updated <LiveClock /></span>
      </div>
      <Reveal delay={200} className="mt-10">
        <WindowPanel label="status.log" tag="LIVE">
          <div className="divide-y divide-[#1a1a1a]">
            {[
              { n: "HRcoM", s: "DEPLOYED", statusClass: "text-[#27c93f]", dotClass: "live-dot" },
              { n: "CHROFA", s: "DEPLOYED", statusClass: "text-[#27c93f]", dotClass: "live-dot" },
              { n: "AI Model Drift Monitor", s: "DEPLOYED", statusClass: "text-[#27c93f]", dotClass: "live-dot" },
              { n: "ThinkBoard", s: "ON GITHUB", statusClass: "text-[#7c3aed]", dotClass: "w-2 h-2 rounded-full bg-[#7c3aed]" },
              { n: "InternsHive", s: "ON GITHUB", statusClass: "text-[#7c3aed]", dotClass: "w-2 h-2 rounded-full bg-[#7c3aed]" },
              { n: "JobQuest", s: "ON GITHUB", statusClass: "text-[#7c3aed]", dotClass: "w-2 h-2 rounded-full bg-[#7c3aed]" },
            ].map((p, i) => (
              <div key={p.n} className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-6 px-5 py-4">
                <span className={p.dotClass} />
                <span className="text-white text-sm font-bold">{p.n}</span>
                <Sparkline seed={i} />
                <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${p.statusClass}`}>{p.s}</span>
              </div>
            ))}
          </div>
        </WindowPanel>
      </Reveal>
    </div>
  </section>
);

/* ---------- 6. Consensus / agent-chat card ---------- */
const ConsensusCard = ({ role, company, lines, outcome }: { role: string; company: string; lines: string[]; outcome: string }) => (
  <div className="mt-8 bg-[#0a0a0a] border border-[#1e1e1e]">
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[#1e1e1e]">
      <div className="w-10 h-10 rounded-full bg-[#7c3aed] flex items-center justify-center text-white font-black text-sm">MB</div>
      <div>
        <div className="text-white text-sm font-bold"><BinaryText text="Malek Ben Salah" /></div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#555]"><BinaryText key={`${role} · ${company}`} text={`${role} · ${company}`} /></div>
      </div>
      <div className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-[#555]"><BinaryText text="build-log" /></div>
    </div>
    <div className="p-5 space-y-2 font-mono text-[12px]">
      {lines.map((m) => (
        <div key={m} className="flex items-start gap-3 text-[#cfcfcf]">
          <span className="live-dot mt-1.5 flex-none" />
          <span><span className="text-[#7c3aed]">&gt;</span> {m}</span>
        </div>
      ))}
    </div>
    <div className="m-5 mt-2 border border-[#1e3a1e] bg-[#0a1a0a] p-4 flex items-start gap-3">
      <span className="text-[#27c93f] text-lg leading-none">✓</span>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#27c93f]"><BinaryText text="Outcome" /></div>
        <div className="text-white text-sm mt-1"><BinaryText key={outcome} text={outcome} /></div>
      </div>
    </div>
  </div>
);

function Index() {
  const experiences = [
    {
      company: "ZeTheta",
      role: "AI Analyst Intern",
      period: "September 2026 · 15 Days",
      bullets: [
        "Architected and delivered HRcoM, a full-stack enterprise HR platform, end-to-end.",
        "Engineered an AI-powered CV ranking pipeline (Groq LLaMA 3.1 + vector embeddings + cosine similarity).",
        "Built 16+ feature modules: facial recognition attendance, leave management, task tracking, RBAC.",
        "Implemented real-time features with Socket.io across all user roles.",
        "Automated PDF/Excel reporting with Puppeteer and ExcelJS.",
        "Designed 50+ REST endpoints documented with Swagger, secured with JWT + bcrypt.",
        "Wrote unit, integration, and E2E tests with Jest and Playwright.",
      ],
      stack: ["React", "TypeScript", "Node.js", "MongoDB", "Groq", "Socket.io"],
      log: [
        "Architected HRcoM from the ground up",
        "Shipped AI CV ranking pipeline (Groq LLaMA 3.1)",
        "Integrated real-time notifications across roles",
        "Wired facial recognition attendance (face-api.js)",
        "Designed 50+ REST endpoints, documented with Swagger",
        "Covered with Jest unit + Playwright E2E suites",
      ],
      outcome: "Production-ready platform · 50+ endpoints · 16+ modules",
    },
    {
      company: "DotJcoM",
      role: "Full-Stack Web Developer & AI Engineering Intern",
      period: "Feb 2026 — Jun 2026",
      bullets: [
        "Designed and delivered an end-to-end model drift and observability monitoring system for financial fraud detection",
        "Implemented data drift detection with two-sample Kolmogorov-Smirnov tests across 29 features",
        "Built a 2-of-3 consensus rule (recall, F1, ROC-AUC) for concept drift, without assuming causality",
        "Validated the pipeline with 5 controlled scenarios",
        "Built a React 19 + TypeScript observability dashboard",
      ],
      stack: ["Python", "pandas", "SciPy", "scikit-learn", "React", "TypeScript"],
      log: [
        "Designed and delivered end-to-end model drift & observability system",
        "Implemented KS-test data drift detection across 29 features",
        "Built 2-of-3 consensus rule for concept drift",
        "Validated pipeline with 5 controlled scenarios",
        "Built React 19 + TypeScript observability dashboard",
      ],
      outcome: "Open source on GitHub · 284K+ transactions analyzed · 5/5 scenarios passed",
    },
  ];
  const groups = [
    { label: "Work Experience", idx: [0, 1] },
  ];
  const [active, setActive] = useState(0);
  const exp = experiences[active];

  const techs = [
    "Python", "TypeScript", "JavaScript", "React", "TanStack", "Tailwind CSS",
    "Node.js", "Express.js", "REST APIs", "Socket.io", "JWT", "Zod", "Swagger",
    "Groq", "LLaMA", "Ollama", "pandas", "scikit-learn", "MongoDB", "MySQL",
    "SQLite", "Redis", "BullMQ", "Docker", "Git", "GitHub", "Postman", "Jest",
    "Playwright", "Vite", "Puppeteer", "Cloudinary",
  ];

  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  useCommandTerminalShortcut(
    isTerminalOpen,
    () => setIsTerminalOpen(true),
    () => setIsTerminalOpen(false)
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <RgbSplitFilter />
      <CursorGlow />
      <FlashlightSpotlight />
      <CommandTerminal isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#0d0d0d] border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="font-black text-white tracking-tight text-lg"><BinaryText text="MALEK BEN SALAH" /><span className="text-[#7c3aed]">.</span></a>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-[#999]">
            <a href="#about" className="nav-link hover:text-white"><BinaryText text="About" /></a>
            <a href="#projects" className="nav-link hover:text-white"><BinaryText text="Projects" /></a>
            <a href="#experience" className="nav-link hover:text-white"><BinaryText text="Experience" /></a>
            <a href="#contact" className="nav-link hover:text-white"><BinaryText text="Contact" /></a>
          </div>
          <MagneticButton>
            <FilledBtn href="#contact">Hire Me</FilledBtn>
          </MagneticButton>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#1a1a1a]">
        <AmbientBg text={HERO_AMBIENT} />
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-16 md:pt-14 md:pb-20 lg:pt-16 lg:pb-24 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <SectionTag>AI-Driven Full-Stack Developer</SectionTag>
            <h1 className="font-black text-5xl md:text-7xl leading-[1.02] tracking-tight">
              <Reveal delay={100}><span className="block text-white">I build systems.</span></Reveal>
              <Reveal delay={200}><span className="block text-[#555]">That think for themselves.</span></Reveal>
            </h1>
            <Reveal delay={300}>
              <p className="text-[#999] text-base md:text-lg mt-8 max-w-lg leading-relaxed">
                Software Engineering graduate (FSM, 2026), now in my first year of a Master's in Information Systems Engineering. I build full-stack platforms with applied AI, from CV-ranking pipelines and model-drift monitoring to AI-assisted scheduling, using the MERN stack, Python and modern LLM tooling.
              </p>
            </Reveal>
            <Reveal delay={400}>
              <div className="flex flex-wrap gap-3 mt-10">
                <FilledBtn href="#projects">View My Work</FilledBtn>
                <GhostBtn href="#about">Read About Me</GhostBtn>
              </div>
            </Reveal>
          </div>
          <Terminal
            title="~/portfolio — zsh"
            role="button"
            tabIndex={0}
            ariaLabel="Open terminal command palette"
            onClick={() => setIsTerminalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsTerminalOpen(true);
              }
            }}
            lines={[
              { t: "$ deploy --agent ai-portfolio --env production", c: "text-white" },
              { t: "▸ building bundle...", c: "text-[#999]" },
              { t: "▸ uploading 247 assets to edge", c: "text-[#999]" },
              { t: "▸ warming inference cache", c: "text-[#999]" },
              { t: "✓ deployed in 1.4s", c: "text-[#27c93f]" },
              { t: "✓ ready for production", c: "text-[#27c93f]" },
              { t: "$ _", c: "text-[#7c3aed]" },
            ]}
          />
        </div>
      </section>

      {/* REQUEST-PATH (scroll-driven diagram) */}
      <RequestPath />

      {/* TECH STRIP */}
      <section className="border-b border-[#1a1a1a] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTag>Technologies I work with</SectionTag>
        </div>
        <div className="overflow-hidden mt-4">
          <div className="marquee flex gap-12 whitespace-nowrap text-[#555] text-2xl font-bold uppercase tracking-wider w-max">
            {[...techs, ...techs, ...techs].map((t, i) => (
              <span key={i} className="flex items-center gap-12">
                {t}
                <span className="text-[#1e1e1e]">/</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative border-b border-[#1a1a1a] py-32">
        <AmbientBg text={ABOUT_AMBIENT} />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-start gap-[60px]">
            <div className="md:basis-[55%] md:flex-1 md:min-w-0">
              <SectionTag num="01">About Me</SectionTag>
              <Heading a="Code with intent." b="AI with purpose." />
              <Reveal delay={300} className="space-y-5 text-[#999] leading-relaxed mt-16 block">
                <p>Software Engineering graduate from FSM (June 2026), now pursuing a Master's in Information Systems Engineering. Passionate about full-stack development with a deep focus on applied AI. Across the MERN stack, REST API design and LLM integration, I have built an AI-powered CV ranking pipeline for an enterprise HR platform (Groq + vector embeddings), an AI-assisted booking SaaS, and a statistical model-drift monitoring system for fraud detection. I own projects end-to-end: database, backend, real-time systems and polished UI. Curious, calm under pressure, driven to ship things that work.</p>
              </Reveal>
            </div>
            <div className="md:basis-[45%] md:min-w-0 flex flex-col items-center gap-2">
              <Reveal delay={250}>
                <div
                  className="cat-wrap relative flex items-center justify-center overflow-visible"
                  style={{ width: "220px", height: "275px", maxWidth: "60vw" }}
                >
                  {/* Soft violet glow behind the cat (#7c3aed, low opacity) */}
                  <div
                    className="cat-glow absolute inset-4 -z-10 rounded-full bg-[#7c3aed] opacity-20 blur-2xl pointer-events-none"
                    aria-hidden="true"
                  />
                  <img
                    src="/cat.svg"
                    alt="Illustration of my cat"
                    width={600}
                    height={660}
                    className="cat-float-quiet w-full h-full object-contain pointer-events-none select-none"
                  />
                  <style>{`
                    @keyframes catQuietFloat {
                       0%, 100% { transform: translateY(0px); }
                       50% { transform: translateY(-8px); }
                    }
                    .cat-float-quiet {
                      animation: catQuietFloat 6s ease-in-out infinite;
                    }
                    @media (prefers-reduced-motion: reduce) {
                      .cat-float-quiet {
                        animation: none !important;
                        transform: none !important;
                      }
                      .cat-glow {
                        opacity: 0 !important;
                        display: none !important;
                      }
                    }
                  `}</style>
                </div>
              </Reveal>
              <Reveal delay={450} className="w-full">
                <div className="relative bg-[#0a0a0a] border border-[#1e1e1e] hover:border-dashed-purple transition-colors p-8 font-mono text-[13px] space-y-5">
                  <CrosshairCorners />
                  {[
                    ["LOCATION", "Monastir, Tunisia"],
                    ["STATUS", "Master's student, open to part-time, internship & freelance"],
                    ["FOCUS", "Full-Stack + Applied AI"],
                    ["LAST ROLE", "AI Analyst Intern @ ZeTheta"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between border-b border-[#1e1e1e] pb-4 last:border-0 last:pb-0">
                      <span className="text-[#555] uppercase tracking-[0.2em] text-[11px]"><BinaryText text={`${k} →`} /></span>
                      <span className="text-white"><BinaryText text={v} /></span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* STACK */}
      <section className="relative border-b border-[#1a1a1a] py-32">
        <AmbientBg text={SKILLS_AMBIENT} />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <SectionTag num="02">Stack</SectionTag>
          <Heading a="Every layer." b="One engineer." />
          <div className="dot-line mt-12" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
            {[
              { group: "Languages", items: ["Python", "TypeScript", "JavaScript", "(also studied: Java, C#, C++, C)"] },
              { group: "Frontend", items: ["React 19", "TanStack Start", "Tailwind CSS", "Vite", "Recharts", "HTML/CSS"] },
              { group: "Backend", items: ["Node.js", "Express.js", "REST APIs", "Socket.io", "JWT", "Zod", "Swagger/OpenAPI", "BullMQ"] },
              { group: "AI / ML / Data", items: ["Groq (LLaMA)", "Ollama", "Vector Embeddings", "Cosine Similarity", "face-api.js", "pandas", "NumPy", "SciPy", "scikit-learn"] },
              { group: "Databases", items: ["MongoDB", "MySQL", "SQLite", "Redis"] },
              { group: "Tools & Testing", items: ["Git", "GitHub", "Postman", "Jest", "Playwright", "Docker", "Puppeteer", "Cloudinary"] },
            ].map((g, i) => (
              <Reveal key={g.group} delay={300 + i * 150}>
                <div className="feature-card skill-card p-6 relative h-full">
                  <div className="fc-icon-bg" />
                  <div className="relative">
                    <div className="fc-icon text-[11px] uppercase tracking-[0.2em] text-[#7c3aed] mb-4">▪ {g.group}</div>
                    <ul className="space-y-2 text-white text-sm fc-title">
                      {g.items.map((it) => <li key={it} className="font-mono">{it}</li>)}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="dot-line delay-1 mt-12" />
        </div>
      </section>

      {/* STATS (Purple Band 1 of 2) */}
      <section className="purple-band border-y border-[#7c3aed]/40 py-16 md:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { n: 6, s: "", l: "Projects Built" },
              { n: 50, s: "+", l: "API Endpoints Built" },
              { n: 16, s: "+", l: "Modules Shipped" },
              { n: 284, s: "K+", l: "Transactions Analyzed" },
            ].map((stat) => (
              <div
                key={stat.l}
                className="relative bg-[#0a0a0a] border border-[#7c3aed]/30 p-8 text-center shadow-xl hover:border-dashed-purple transition-colors"
              >
                <CrosshairCorners />
                <StatNumber value={stat.n} suffix={stat.s} />
                <div className="text-[11px] uppercase tracking-[0.25em] text-[#999] mt-3 font-mono">
                  <BinaryText text={stat.l} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SYSTEM STATUS */}
      <SystemStatus />

      {/* BENCHMARK */}
      <Benchmark />

      {/* PROJECTS */}
      <section id="projects" className="relative border-b border-[#1a1a1a] py-32">
        <AmbientBg text={PROJ_AMBIENT} />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <SectionTag num="05">Projects</SectionTag>
          <Heading a="Things I've built." b="That actually ship." />
          <div className="grid md:grid-cols-2 gap-4 mt-16">
            {[
              {
                id: "hrcom" as const,
                tag: "FULL-STACK · AI",
                title: "HRcoM",
                desc: "Enterprise HR & internship management platform with an AI-powered CV ranking pipeline (Groq LLaMA 3.1 + vector embeddings), facial recognition attendance, real-time notifications via Socket.io, and 50+ documented REST endpoints.",
                stack: ["React", "TypeScript", "Node.js", "MongoDB", "Groq", "Socket.io"],
                link: PROJECT_LINKS.hrcom,
              },
              {
                id: "chrofa" as const,
                tag: "FULL-STACK · AI",
                title: "CHROFA",
                desc: "AI-powered multi-tenant booking SaaS for service businesses. Public booking portal with real-time slot-conflict prevention, admin dashboard with analytics, a Groq/Ollama assistant for natural-language booking, WhatsApp and email reminders, and two-way Google Calendar sync.",
                stack: ["React 19", "TanStack Start", "Node.js", "MongoDB", "Redis", "Groq"],
                link: PROJECT_LINKS.chrofa,
              },
              {
                id: "driftMonitor" as const,
                tag: "ML · DATA",
                title: "AI Model Drift & Observability Monitoring System",
                desc: "End-to-end drift monitoring for fraud detection. Separates data drift (two-sample KS tests on 29 features) from concept drift (2-of-3 rule on recall, F1 and ROC-AUC), validated by 5 controlled scenarios on 284,807 transactions, with a React observability dashboard.",
                stack: ["Python", "pandas", "SciPy", "scikit-learn", "React", "TypeScript", "Recharts"],
                link: PROJECT_LINKS.driftMonitor,
              },
              {
                id: "thinkboard" as const,
                tag: "FULL-STACK",
                title: "ThinkBoard",
                desc: "A MERN-stack note-taking app with full CRUD functionality, rate limiting via Upstash, Tailwind + DaisyUI interface, deployed on Render with uptime monitoring.",
                stack: ["MongoDB", "Express.js", "React", "Node.js", "Tailwind CSS"],
                link: PROJECT_LINKS.thinkboard,
              },
              {
                id: "internshive" as const,
                tag: "FULL-STACK",
                title: "InternsHive",
                desc: "A full-stack internship platform built with a colleague — user authentication, CRUD operations, and a responsive UI for a seamless internship search experience.",
                stack: ["HTML", "CSS", "JavaScript", "Node.js", "Express.js", "SQLite"],
                link: PROJECT_LINKS.internshive,
              },
              {
                id: "jobquest" as const,
                tag: "FRONT-END",
                title: "JobQuest",
                desc: "A LinkedIn-style professional networking platform with responsive layouts and interactive features, designed and built independently from concept to deployment.",
                stack: ["HTML", "CSS", "JavaScript"],
                link: PROJECT_LINKS.jobquest,
              },
            ].map((p, i) => (
              <Reveal key={p.title} delay={300 + i * 150}>
                <div className="feature-card p-7 flex flex-col h-full relative">
                  <div className="fc-icon-bg" />
                  <div className="relative flex flex-col h-full">
                    <ProjectThumbnail title={p.title} tag={p.tag} type={p.id} />
                    <div className="fc-icon text-[10px] uppercase tracking-[0.25em] text-[#7c3aed] mb-4"><BinaryText text={`▪ ${p.tag}`} /></div>
                    <h3 className="fc-title text-2xl font-bold text-white mb-2"><GlitchReveal text={p.title} /></h3>
                    <p className="text-[#999] text-sm leading-relaxed flex-1">{p.desc}</p>
                    <div className="flex flex-wrap gap-2 mt-6">
                      {p.stack.map((s) => (
                        <span key={s} className="font-mono text-[11px] text-[#999] border border-[#1e1e1e] px-2 py-1"><BinaryText text={s} /></span>
                      ))}
                    </div>
                    {p.link ? (
                      <a
                        href={p.link}
                        target={p.link.startsWith("http") ? "_blank" : undefined}
                        rel={p.link.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="block mt-6 text-[12px] uppercase tracking-[0.2em] text-[#7c3aed] hover:text-white font-bold"
                      >
                        <BinaryText text={p.link.includes("github.com") ? "View on GitHub" : "View Project"} /> ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={400} className="mt-10">
            <ModuleSelector />
          </Reveal>
        </div>
      </section>

      {/* UNDER THE HOOD */}
      <UnderTheHood />

      {/* EXPERIENCE */}
      <section id="experience" className="border-b border-[#1a1a1a] py-32">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTag num="07">Experience</SectionTag>
          <Heading a="Where I've shipped." b="What I've learned." />
          <div className="grid md:grid-cols-[260px_1fr] gap-4 mt-16">
            <div className="flex md:flex-col border border-[#1e1e1e] bg-[#0a0a0a] overflow-x-auto md:overflow-visible">
              {groups.map((g) => (
                <div key={g.label} className="md:contents">
                  <div className="exp-group-label hidden md:flex"><BinaryText text={g.label} /></div>
                  {g.idx.map((i) => {
                    const e = experiences[i];
                    return (
                      <button
                        key={e.company}
                        onClick={() => setActive(i)}
                        className={`text-left px-5 py-4 text-[13px] font-bold uppercase tracking-wider border-b border-[#1e1e1e] last:border-0 transition-colors whitespace-nowrap ${active === i ? "bg-[#0d0d0d] text-white border-l-2 border-l-[#7c3aed]" : "text-[#666] hover:text-white"}`}
                      >
                        <BinaryText text={e.company} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div>
              <div className="relative border border-[#1e1e1e] bg-[#0a0a0a] hover:border-dashed-purple transition-colors p-8">
                <CrosshairCorners />
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                  <h3 className="text-2xl font-bold text-white"><BinaryText key={exp.role} text={exp.role} /></h3>
                  <span className="font-mono text-[12px] text-[#555] uppercase"><BinaryText key={exp.period} text={exp.period} /></span>
                </div>
                <div className="text-[#7c3aed] font-mono text-sm mb-6"><BinaryText key={exp.company} text={`@ ${exp.company}`} /></div>
                <ul className="space-y-3">
                  {exp.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-[#999] leading-relaxed">
                      <span className="text-[#7c3aed] mt-1.5">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-[#1e1e1e]">
                  {exp.stack.map((s) => (
                    <span key={s} className="font-mono text-[11px] text-[#999] border border-[#1e1e1e] px-2 py-1"><BinaryText text={s} /></span>
                  ))}
                </div>
              </div>
              <ConsensusCard role={exp.role} company={exp.company} lines={exp.log} outcome={exp.outcome} />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-b border-[#1a1a1a] py-32">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTag num="08">Recognition</SectionTag>
          <Heading a="Still early." b="Building my track record." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
            {[
              { q: "Software Engineering degree, FSM (2026). Now in the first year of a Master's in Information Systems Engineering.", n: "Education", r: "FSM · Master's" },
              { q: "Internship completion certificate from ZeTheta (AI Analyst Intern, 2026).", n: "Certificate", r: "ZeTheta" },
              { q: "Self-motivated learner. Problem solver. Calm under pressure. Comfortable owning projects end-to-end from database design to polished UI.", n: "Soft Skills", r: "Driven & detail-oriented" },
              { q: "Arabic — Native / English — Fluent / French — Intermediate", n: "Languages", r: "Multilingual communicator" },
            ].map((t, i) => (
              <Reveal key={t.n} delay={300 + i * 150}>
                <div className="feature-card p-7 flex flex-col h-full relative">
                  <div className="fc-icon-bg" />
                  <div className="relative">
                    <p className="fc-title text-white leading-relaxed">"{t.q}"</p>
                    <div className="mt-8 pt-6 border-t border-[#1e1e1e]">
                      <div className="text-white font-bold text-sm"><BinaryText text={t.n} /></div>
                      <div className="text-[#666] text-[12px] mt-1"><BinaryText text={t.r} /></div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GITHUB ACTIVITY */}
      <section className="border-b border-[#1a1a1a] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-[#777] mb-6">
              <span className="inline-block w-2 h-2 bg-[#7c3aed]" />
              <span className="text-[#7c3aed] font-semibold">09 //</span>
              <BinaryText text="GitHub Activity" />
            </div>
            <GitHubCalendar />
            <GitHubActivityTable />
          </Reveal>
        </div>
      </section>

      {/* CONTACT (Purple Band 2 of 2) */}
      <section id="contact" className="purple-band border-y border-[#7c3aed]/50 py-24 md:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionTag num="10" darkPill>Contact</SectionTag>
          <h2 className="font-black text-4xl md:text-6xl leading-[1.05] tracking-tight">
            <span className="block text-white"><GlitchReveal text="Let's build something." delayMs={100} /></span>
            <span className="block text-purple-200/90"><GlitchReveal text="That matters." delayMs={200} /></span>
          </h2>
          <div className="grid md:grid-cols-2 gap-12 mt-16 items-start">
            <div>
              <p className="text-purple-100/90 text-lg leading-relaxed max-w-md">
                Got a project that needs shipping? I'm open to part-time roles, internships and freelance work. Let's talk.
              </p>
              <div className="flex flex-wrap gap-3 mt-10">
                <a
                  href="mailto:malekbensalah056@gmail.com"
                  className="inline-flex items-center gap-3 px-6 py-3.5 bg-white text-black font-mono font-bold text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-neutral-100 transition-all hover:translate-x-0.5"
                >
                  <span><BinaryText text="Send a Message" /></span>
                  <span>↗</span>
                </a>
                <a
                  href={CV_FILE_PATH}
                  className="inline-flex items-center gap-3 px-6 py-3.5 bg-black/40 hover:bg-black/60 text-white border border-white/30 font-mono text-xs uppercase tracking-[0.2em] backdrop-blur-sm transition-all"
                >
                  <BinaryText text="Download CV" />
                </a>
              </div>
            </div>
            <div className="relative bg-[#0a0a0a] border border-white/15 shadow-2xl">
              <CrosshairCorners />
              <div className="flex items-center px-4 py-3 border-b border-[#1e1e1e] relative">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-mono uppercase tracking-[0.2em] text-[#777] pointer-events-none">
                  contact.sh
                </div>
              </div>
              <div className="p-6 font-mono text-[13px] space-y-4">
                {[
                  ["EMAIL", "malekbensalah056@gmail.com"],
                  ["PHONE", "+216 93 113 619"],
                  ["LINKEDIN", "linkedin.com/in/malek-bensalah-a2307b295"],
                  ["GITHUB", "github.com/malekbensalah"],
                  ["LOCATION", "Monastir, Tunisia"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-[#1e1e1e] pb-3 last:border-0 last:pb-0">
                    <span className="text-[#666] uppercase tracking-[0.2em] text-[11px]"><BinaryText text={`${k} →`} /></span>
                    <span className="text-white"><BinaryText text={v} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#141414] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="font-black text-white tracking-tight text-lg"><BinaryText text="MALEK BEN SALAH" /><span className="text-[#7c3aed]">.</span></div>
              <p className="text-[#666] text-sm mt-4 max-w-xs">Built with precision. Shipped with AI.</p>
            </div>
            {[
              {
                h: "Work",
                l: [
                  { t: "Projects", href: "#projects" },
                  { t: "Experience", href: "#experience" },
                ],
              },
              {
                h: "Connect",
                l: [
                  { t: "Email", href: "mailto:malekbensalah056@gmail.com" },
                  { t: "GitHub", href: "https://github.com/malekbensalah" },
                  { t: "LinkedIn", href: "https://linkedin.com/in/malek-bensalah-a2307b295" },
                ],
              },
            ].map((c) => (
              <div key={c.h}>
                <div className="text-[11px] uppercase tracking-[0.25em] text-[#555] mb-5"><BinaryText text={`▪ ${c.h}`} /></div>
                <ul className="space-y-3">
                  {c.l.map((i) => <li key={i.t}><a href={i.href} className="nav-link text-[#999] hover:text-white text-sm"><BinaryText text={i.t} /></a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between items-center gap-4 mt-16 pt-8 border-t border-[#1e1e1e] text-[12px] text-[#555] font-mono uppercase tracking-wider">
            <div><BinaryText text="© 2026 Malek Ben Salah" /></div>
            {/* Status row: availability dot + status + local time */}
            <div className="flex items-center gap-3">
              <span className="status-dot" aria-hidden="true" />
              <span>open to part-time, internship & freelance</span>
              <span className="text-[#1e1e1e]">·</span>
              <FooterClock />
              <span className="text-[#555]">TN</span>
            </div>
            <div><BinaryText text="Built with precision. Shipped with AI." /></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
