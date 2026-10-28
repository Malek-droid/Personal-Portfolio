import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useCursorSpotlight } from "@/hooks/useCursorSpotlight";
import { BinaryText } from "@/components/BinaryText";
import { CommandTerminal } from "@/components/CommandTerminal";
import { useCommandTerminalShortcut } from "@/hooks/useCommandTerminalShortcut";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Malek Ben Salah — Full-Stack Developer" },
      { name: "description", content: "Final-year Software Engineering student specializing in full-stack development with applied AI. Code that thinks. AI that ships." },
      { property: "og:title", content: "Malek Ben Salah — Full-Stack Developer" },
      { property: "og:description", content: "Final-year Software Engineering student specializing in full-stack development with applied AI." },
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
const SectionTag = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="reveal flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-[#555] mb-6"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="inline-block w-2 h-2 bg-[#7c3aed]" />
      {typeof children === "string" ? <BinaryText text={children} /> : children}
    </div>
  );
};

const Heading = ({ a, b }: { a: string; b: string }) => {
  const r1 = useReveal<HTMLSpanElement>();
  const r2 = useReveal<HTMLSpanElement>();
  return (
    <h2 className="font-black text-4xl md:text-6xl leading-[1.05] tracking-tight">
      <span ref={r1} className="reveal block text-white" style={{ transitionDelay: "100ms" }}>{a}</span>
      <span ref={r2} className="reveal block text-[#555]" style={{ transitionDelay: "200ms" }}>{b}</span>
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
$ curl -X POST https://api.alex.dev/agent
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
  <div className={`bg-[#0a0a0a] border border-[#1e1e1e] ${className}`}>
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

/* ---------- 1. Request-Path diagram ---------- */
const CatMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
    <path d="M5 8 L7 3 L10 7" />
    <path d="M19 8 L17 3 L14 7" />
    <path d="M6 13 C6 9.5 8.5 7.5 12 7.5 C15.5 7.5 18 9.5 18 13 C18 16.5 15.5 19 12 19 C8.5 19 6 16.5 6 13 Z" />
    <circle cx="9.8" cy="12.2" r="0.6" fill="#7c3aed" stroke="none" />
    <circle cx="14.2" cy="12.2" r="0.6" fill="#7c3aed" stroke="none" />
    <path d="M11.4 14.2 L12 15 L12.6 14.2" />
    <path d="M7.5 13 L5 12.5 M7.5 13.8 L5 14.4" />
    <path d="M16.5 13 L19 12.5 M16.5 13.8 L19 14.4" />
  </svg>
);

const RequestPath = () => (
  <WindowPanel label="REQUEST-PATH" tag={<span className="text-[#7c3aed]">🔒 end-to-end</span>}>
    <div className="p-8 md:p-10">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(60px,2fr)_minmax(0,1.1fr)_minmax(60px,2fr)_minmax(0,1fr)] items-center gap-4">
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-5 text-center">
          <div className="text-[#7c3aed] text-xl mb-2">◆</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Your Idea</div>
          <div className="text-white text-sm font-bold mt-1">Concept</div>
        </div>
        <div className="hidden md:flex flex-col items-center gap-2 px-2 w-full">
          <span className="text-[9px] font-mono text-[#7c3aed] tracking-[0.15em]">⚡ SHIPPED</span>
          <div className="dash-line" />
        </div>
        <div className="border border-[#7c3aed] bg-[#0d0d0d] p-5 text-center relative" style={{ boxShadow: "0 0 24px rgba(124,58,237,0.15)" }}>
          <CatMark />
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7c3aed]">MALEK</div>
          <div className="text-white text-sm font-bold mt-1">Full-stack build</div>
        </div>
        <div className="hidden md:flex flex-col items-center gap-2 px-2 w-full">
          <span className="text-[9px] font-mono text-[#7c3aed] tracking-[0.15em]">⚡ SHIPPED</span>
          <div className="dash-line" />
        </div>
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] p-5 text-center">
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {["React","Node","Mongo","Groq","JWT","+N"].map(s => (
              <span key={s} className="text-[9px] font-mono text-[#999] border border-[#1e1e1e] py-1">{s}</span>
            ))}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Every Stack</div>
        </div>
      </div>
      <div className="text-center mt-8 font-mono text-[11px] uppercase tracking-[0.3em] text-[#555]">
        IDEA · CODE · PRODUCTION — SHIPPED END TO END
      </div>
    </div>
  </WindowPanel>
);

/* ---------- 2. Benchmark chart ---------- */
function BenchBar({ label, value, violet = false, suffix = "%" }: { label: string; value: number; violet?: boolean; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) { el.style.width = value + "%"; io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(el.parentElement!.parentElement!);
    return () => io.disconnect();
  }, [value]);
  return (
    <div className="grid grid-cols-[140px_1fr_50px] items-center gap-4 py-2">
      <span className="font-mono text-[12px] text-[#999]"><BinaryText text={label} /></span>
      <div className={`bench-bar ${violet ? "violet" : ""}`}><span ref={ref} style={{ width: 0 }} /></div>
      <span className={`font-mono text-[12px] text-right ${violet ? "text-[#7c3aed]" : "text-[#666]"}`}>{value}{suffix}</span>
    </div>
  );
}
const Benchmark = () => (
  <section className="border-b border-[#1a1a1a] py-32">
    <div className="max-w-7xl mx-auto px-6">
      <SectionTag>By the numbers</SectionTag>
      <Heading a="Same stack." b="Sharper execution." />
      <div className="grid md:grid-cols-2 gap-4 mt-16">
        <Reveal delay={200}>
          <WindowPanel label="stack-proficiency" tag="[ FIG.01 ]">
            <div className="p-6">
              <BenchBar label="React / TS" value={94} violet />
              <BenchBar label="Node.js / Express" value={90} />
              <BenchBar label="MongoDB" value={86} />
              <BenchBar label="AI / LLM Integration" value={82} />
              <BenchBar label="Socket.io / Real-time" value={78} />
            </div>
          </WindowPanel>
        </Reveal>
        <Reveal delay={350}>
          <WindowPanel label="project-velocity" tag="[ FIG.02 ]">
            <div className="p-6">
              <BenchBar label="HRcoM" value={100} violet suffix=" feat" />
              <BenchBar label="ThinkBoard" value={42} suffix=" feat" />
              <BenchBar label="InternsHive" value={36} suffix=" feat" />
              <BenchBar label="JobQuest" value={22} suffix=" feat" />
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
  { f: "llm/integration.ts", n: "LLM Integration", c: [
    "const res = await groq.chat",
    "  .completions.create({",
    "    model: 'llama-3.1-70b',",
    "    messages: [{ role:'user',",
    "      content: prompt }],",
    "  });",
  ], v: 0.94 },
  { f: "ai/embeddings.ts", n: "Vector Embeddings", c: [
    "const v1 = await embed(cv);",
    "const v2 = await embed(job);",
    "const score = cosine(v1, v2);",
    "return rank(score);",
  ], v: 0.91 },
  { f: "ai/vision.ts", n: "Computer Vision", c: [
    "const det = await faceapi",
    "  .detectAllFaces(img)",
    "  .withFaceLandmarks()",
    "  .withFaceDescriptors();",
    "return match(det, known);",
  ], v: 0.88 },
  { f: "ai/prompting.ts", n: "Prompt Engineering", c: [
    "const prompt = `",
    "Role: HR analyst.",
    "Task: Score CV vs role.",
    "Context: ${role}",
    "Input: ${cv}",
    "Output: JSON { score, why }`;",
  ], v: 0.92 },
  { f: "ai/automation.ts", n: "AI-Assisted Workflows", c: [
    "const ranked = candidates",
    "  .map(scoreWithLLM)",
    "  .sort((a,b) => b.s - a.s);",
    "await notify(ranked.slice(0,5));",
  ], v: 0.90 },
];
const UnderTheHood = () => (
  <section className="border-b border-[#1a1a1a] py-32">
    <div className="max-w-7xl mx-auto px-6">
      <SectionTag>AI Toolkit</SectionTag>
      <Heading a="AI isn't a feature." b="It's how I build." />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-16">
        {AI_TOOLKIT.map((p, i) => {
          const isTop = p.v === Math.max(...AI_TOOLKIT.map(x => x.v));
          return (
            <Reveal key={p.f} delay={200 + i * 100}>
              <div className="bg-[#0a0a0a] border border-[#1e1e1e] h-full flex flex-col">
                <div className="px-3 py-2 border-b border-[#1e1e1e] font-mono text-[10px] text-[#666] truncate"><BinaryText text={p.f} /></div>
                <div className="p-4 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#7c3aed] mb-3 font-mono"><BinaryText text={`▪ ${p.n}`} /></div>
                  <pre className="font-mono text-[11px] text-[#999] leading-relaxed whitespace-pre-wrap">{p.c.join("\n")}</pre>
                </div>
                <div className="px-4 pb-4">
                  <div className={`bench-bar ${isTop ? "violet" : ""}`}><span style={{ width: `${p.v * 100}%` }} /></div>
                  <div className={`mt-2 font-mono text-[11px] ${isTop ? "text-[#7c3aed]" : "text-[#666]"}`}>{p.v.toFixed(2)}</div>
                </div>
              </div>
            </Reveal>
          );
        })}
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
      <SectionTag>System status</SectionTag>
      <Heading a="Always learning." b="Always shipping." />
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-[#666]">
        <span><span className="text-white">4/4</span> Projects Live</span>
        <span className="text-[#1e1e1e]">·</span>
        <span><span className="text-white">100%</span> Uptime on curiosity</span>
        <span className="text-[#1e1e1e]">·</span>
        <span>Last updated <LiveClock /></span>
      </div>
      <Reveal delay={200} className="mt-10">
        <WindowPanel label="status.log" tag="LIVE">
          <div className="divide-y divide-[#1a1a1a]">
            {[
              { n: "HRcoM", s: "Operational", live: true },
              { n: "ThinkBoard", s: "Operational", live: true },
              { n: "InternsHive", s: "Operational", live: true },
              { n: "JobQuest", s: "Operational", live: true },
            ].map((p, i) => (
              <div key={p.n} className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-6 px-5 py-4">
                <span className={p.live ? "live-dot" : "w-2 h-2 rounded-full bg-[#ffbd2e]"} />
                <span className="text-white text-sm font-bold">{p.n}</span>
                <Sparkline seed={i} />
                <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${p.live ? "text-[#27c93f]" : "text-[#ffbd2e]"}`}>{p.s}</span>
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
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#555]"><BinaryText text={`${role} · ${company}`} /></div>
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
        <div className="text-white text-sm mt-1"><BinaryText text={outcome} /></div>
      </div>
    </div>
  </div>
);

function Index() {
  const experiences = [
    { company: "DotJcoM", role: "Software Engineering Intern", period: "2025 — 2026",
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
      outcome: "Production-ready platform · 50+ endpoints · 16+ modules" },
    { company: "ThinkBoard", role: "Full-Stack Developer", period: "October 2025",
      bullets: [
        "Built a MERN-stack note-taking app with full CRUD operations end-to-end.",
        "Designed and Postman-tested a complete REST API surface.",
        "Integrated Upstash rate limiting to protect public endpoints.",
        "Deployed to Render with UptimeRobot live uptime monitoring.",
        "Styled UI with Tailwind CSS + DaisyUI for a clean, responsive layout.",
      ],
      stack: ["MongoDB", "Express.js", "React", "Node.js", "Tailwind CSS", "DaisyUI"],
      log: [
        "Scaffolded MERN stack project structure",
        "Implemented full CRUD with Express + Mongoose",
        "Verified API surface end-to-end in Postman",
        "Wired Upstash rate limiting on public routes",
        "Deployed to Render, hooked UptimeRobot monitoring",
        "Themed UI with Tailwind + DaisyUI",
      ],
      outcome: "Production note-taking app · Rate-limited API · Live uptime monitoring" },
    { company: "InternsHive", role: "Full-Stack Developer", period: "April 2025",
      bullets: [
        "Built a full-stack internship platform with HTML/CSS/JS, Node.js, Express, and SQLite.",
        "Implemented user authentication and full CRUD for internship listings.",
        "Designed a responsive UI for browsing and applying to opportunities.",
        "Managed database schema, queries, and Git-based collaboration.",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Node.js", "Express.js", "SQLite"],
      log: [
        "Set up Node + Express + SQLite backend",
        "Implemented auth (sessions + hashed passwords)",
        "Built CRUD for internship listings + applications",
        "Designed responsive front-end UI",
        "Managed Git workflow with collaborator",
      ],
      outcome: "Full-stack internship platform · Auth + CRUD · SQLite-backed" },
    { company: "JobQuest", role: "Front-End Developer", period: "November 2024",
      bullets: [
        "Built a LinkedIn-style professional networking platform solo, concept to deployment.",
        "Designed responsive layouts and interactive feed/profile components.",
        "Owned every layer of the front-end — structure, style, behavior, deploy.",
      ],
      stack: ["HTML", "CSS", "JavaScript"],
      log: [
        "Sketched information architecture for a networking app",
        "Built responsive layouts (feed, profile, connections)",
        "Implemented interactive UI in vanilla JS",
        "Polished styles for cross-device consistency",
        "Deployed live",
      ],
      outcome: "Solo-built networking platform · Concept to deployment" },
  ];
  const groups = [
    { label: "Work Experience", idx: [0] },
    { label: "Personal Projects", idx: [1] },
    { label: "Freelance", idx: [2, 3] },
  ];
  const [active, setActive] = useState(0);
  const exp = experiences[active];

  const techs = ["Java", "C#", "C++", "Python", "C", "JavaScript", "TypeScript", "React", "HTML", "CSS", "Tailwind CSS", "DaisyUI", "Node.js", "Express.js", "REST APIs", "Socket.io", "JWT", "Swagger", "Groq", "LLaMA 3.1", "MongoDB", "MySQL", "SQLite", "Git", "GitHub", "Postman", "Jest", "Playwright", "Docker", "Cloudinary", "Puppeteer"];

  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  useCommandTerminalShortcut(
    isTerminalOpen,
    () => setIsTerminalOpen(true),
    () => setIsTerminalOpen(false)
  );

  return (
    <div className="min-h-screen bg-black text-white">
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
          <FilledBtn href="#contact">Hire Me</FilledBtn>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#1a1a1a]">
        <AmbientBg text={HERO_AMBIENT} />
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 md:py-40 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionTag>AI-Driven Full-Stack Developer</SectionTag>
            <h1 className="font-black text-5xl md:text-7xl leading-[1.02] tracking-tight">
              <Reveal delay={100}><span className="block text-white">I build systems.</span></Reveal>
              <Reveal delay={200}><span className="block text-[#555]">That think for themselves.</span></Reveal>
            </h1>
            <Reveal delay={300}>
              <p className="text-[#999] text-base md:text-lg mt-8 max-w-lg leading-relaxed">
                Final-year Software Engineering student at the Faculty of Science of Monastir (FSM), specializing in full-stack development with applied AI. Builds production-grade platforms — from AI-powered candidate ranking pipelines to real-time HR systems — using the MERN stack and modern LLM tooling.
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
              { t: "✓ ready at https://alex.dev", c: "text-[#27c93f]" },
              { t: "$ _", c: "text-[#7c3aed]" },
            ]}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24 md:pb-32">
          <Reveal delay={500}><RequestPath /></Reveal>
        </div>
      </section>

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
              <SectionTag>About Me</SectionTag>
              <Heading a="Code with intent." b="AI with purpose." />
              <Reveal delay={300} className="space-y-5 text-[#999] leading-relaxed mt-16 block">
                <p>Final-year Software Engineering student at FSM (graduating June 2026), passionate about full-stack development with a deep focus on applied AI. Experienced across the MERN stack, REST API architecture, and LLM integration — recently architected an AI-powered CV ranking pipeline using Groq (LLaMA 3.1) and vector embeddings for an enterprise HR platform. Comfortable owning a project end-to-end: database design, backend logic, real-time systems, and polished UI. Curious, calm under pressure, and driven to ship things that actually work in production.</p>
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
                    src="/cat-final.png"
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
                <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-8 font-mono text-[13px] space-y-5">
                  {[
                    ["LOCATION", "Monastir, Tunisia"],
                    ["STATUS", "Final-Year Student, Available for Internship"],
                    ["FOCUS", "Full-Stack + Applied AI"],
                    ["CURRENTLY", "Software Engineering Intern @ DotJcoM"],
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
          <SectionTag>Stack</SectionTag>
          <Heading a="Every layer." b="One engineer." />
          <div className="dot-line mt-12" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
            {[
              { group: "Languages", items: ["Java", "C#", "C++", "Python", "C", "JavaScript", "TypeScript"] },
              { group: "Frontend", items: ["React", "HTML", "CSS", "Tailwind CSS", "DaisyUI"] },
              { group: "Backend", items: ["Node.js", "Express.js", "REST APIs", "Socket.io", "JWT", "Swagger/OpenAPI"] },
              { group: "AI / ML", items: ["Groq (LLaMA 3.1)", "Vector Embeddings", "Cosine Similarity Scoring", "face-api.js"] },
              { group: "Databases", items: ["MongoDB", "MySQL", "SQLite"] },
              { group: "Tools & Testing", items: ["Git", "GitHub", "Postman", "Jest", "Playwright", "Docker", "Cloudinary", "Puppeteer"] },
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

      {/* STATS */}
      <section className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { n: 16, s: "+", l: "Modules Shipped" },
              { n: 50, s: "+", l: "API Endpoints Built" },
              { n: 4, s: "", l: "Production Projects" },
              { n: 0, s: "", l: "Copy-Paste Code" },
            ].map((stat, i) => (
              <div key={stat.l} className={`py-16 px-6 text-center ${i !== 0 ? "md:border-l border-[#1e1e1e]" : ""} ${i % 2 === 1 ? "border-l md:border-l border-[#1e1e1e]" : ""} ${i >= 2 ? "border-t md:border-t-0 border-[#1e1e1e]" : ""}`}>
                <StatNumber value={stat.n} suffix={stat.s} />
                <div className="text-[11px] uppercase tracking-[0.25em] text-[#555] mt-3"><BinaryText text={stat.l} /></div>
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
          <SectionTag>Projects</SectionTag>
          <Heading a="Things I've built." b="That actually ship." />
          <div className="grid md:grid-cols-3 gap-4 mt-16">
            {[
              { tag: "FULL-STACK · AI", title: "HRcoM", desc: "Enterprise HR & internship management platform with an AI-powered CV ranking pipeline (Groq LLaMA 3.1 + vector embeddings), facial recognition attendance, real-time notifications via Socket.io, and 50+ documented REST endpoints.", stack: ["React", "TypeScript", "Node.js", "MongoDB", "Groq", "Socket.io"] },
              { tag: "FULL-STACK", title: "ThinkBoard", desc: "A MERN-stack note-taking app with full CRUD functionality, rate limiting via Upstash, Tailwind + DaisyUI interface, deployed on Render with uptime monitoring.", stack: ["MongoDB", "Express.js", "React", "Node.js", "Tailwind CSS"] },
              { tag: "FULL-STACK", title: "InternsHive", desc: "A full-stack internship platform built with a colleague — user authentication, CRUD operations, and a responsive UI for a seamless internship search experience.", stack: ["HTML", "CSS", "JavaScript", "Node.js", "Express.js", "SQLite"] },
              { tag: "FRONT-END", title: "JobQuest", desc: "A LinkedIn-style professional networking platform with responsive layouts and interactive features, designed and built independently from concept to deployment.", stack: ["HTML", "CSS", "JavaScript"] },
            ].map((p, i) => (
              <Reveal key={p.title} delay={300 + i * 150}>
                <div className="feature-card p-7 flex flex-col h-full relative">
                  <div className="fc-icon-bg" />
                  <div className="relative">
                    <div className="fc-icon text-[10px] uppercase tracking-[0.25em] text-[#7c3aed] mb-6"><BinaryText text={`▪ ${p.tag}`} /></div>
                    <h3 className="fc-title text-2xl font-bold text-white"><BinaryText text={p.title} /></h3>
                    <p className="text-[#999] text-sm mt-3 leading-relaxed">{p.desc}</p>
                    <div className="flex flex-wrap gap-2 mt-6">
                      {p.stack.map((s) => (
                        <span key={s} className="font-mono text-[11px] text-[#999] border border-[#1e1e1e] px-2 py-1"><BinaryText text={s} /></span>
                      ))}
                    </div>
                    <a href="#" className="block mt-8 text-[12px] uppercase tracking-[0.2em] text-[#7c3aed] hover:text-white font-bold"><BinaryText text="View Project" /> ↗</a>
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
          <SectionTag>Experience</SectionTag>
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
              <div className="border border-[#1e1e1e] bg-[#0a0a0a] p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                  <h3 className="text-2xl font-bold text-white"><BinaryText text={exp.role} /></h3>
                  <span className="font-mono text-[12px] text-[#555] uppercase"><BinaryText text={exp.period} /></span>
                </div>
                <div className="text-[#7c3aed] font-mono text-sm mb-6"><BinaryText text={`@ ${exp.company}`} /></div>
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
          <SectionTag>Recognition</SectionTag>
          <Heading a="Still early." b="Building my track record." />
          <div className="grid md:grid-cols-3 gap-4 mt-16">
            {[
              { q: "Final-year Software Engineering at FSM. Coursework spans AI, database systems, software architecture, and full-stack development.", n: "Education", r: "FSM — Software Engineering" },
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

      {/* CONTACT */}
      <section id="contact" className="border-b border-[#1a1a1a] py-32">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTag>Contact</SectionTag>
          <Heading a="Let's build something." b="That matters." />
          <div className="grid md:grid-cols-2 gap-12 mt-16 items-start">
            <div>
              <p className="text-[#999] text-lg leading-relaxed max-w-md">
                Got a project that needs shipping? An idea that needs an engineer? I'm available for internships and collaborations — let's talk.
              </p>
              <div className="flex flex-wrap gap-3 mt-10">
                <FilledBtn href="mailto:malekbensalah056@gmail.com">Send a Message</FilledBtn>
                <GhostBtn href="#">Download CV</GhostBtn>
              </div>
            </div>
            <div className="bg-[#0d0d0d] border border-[#222]">
              <div className="flex items-center px-4 py-3 border-b border-[#1e1e1e] relative">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-mono uppercase tracking-[0.2em] text-[#555] pointer-events-none">
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
                    <span className="text-[#555] uppercase tracking-[0.2em] text-[11px]"><BinaryText text={`${k} →`} /></span>
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
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="font-black text-white tracking-tight text-lg"><BinaryText text="MALEK BEN SALAH" /><span className="text-[#7c3aed]">.</span></div>
              <p className="text-[#666] text-sm mt-4 max-w-xs">Built with precision. No copy-paste.</p>
            </div>
            {[
              { h: "Work", l: ["Projects", "Case Studies", "Open Source"] },
              { h: "Connect", l: ["Email", "GitHub", "LinkedIn"] },
              { h: "Legal", l: ["Privacy", "Imprint", "Colophon"] },
            ].map((c) => (
              <div key={c.h}>
                <div className="text-[11px] uppercase tracking-[0.25em] text-[#555] mb-5"><BinaryText text={`▪ ${c.h}`} /></div>
                <ul className="space-y-3">
                  {c.l.map((i) => <li key={i}><a href="#" className="nav-link text-[#999] hover:text-white text-sm"><BinaryText text={i} /></a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between items-center gap-4 mt-16 pt-8 border-t border-[#1e1e1e] text-[12px] text-[#555] font-mono uppercase tracking-wider">
            <div><BinaryText text="© 2026 Malek Ben Salah" /></div>
            <div><BinaryText text="Built with precision. No copy-paste." /></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
