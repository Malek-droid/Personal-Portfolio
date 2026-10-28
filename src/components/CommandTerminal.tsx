import React, { useEffect, useRef, useState } from "react";
import { executeCommand } from "@/lib/terminal-commands";

interface CommandTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OutputEntry {
  id: number;
  type: "command" | "response";
  text: string;
}

const INITIAL_WELCOME: OutputEntry[] = [
  { id: 1, type: "response", text: "Malek Ben Salah — Interactive Portfolio Terminal" },
  { id: 2, type: "response", text: "Type 'help' to list available commands. Press Esc to close." },
];

/**
 * CommandTerminal - modal command palette with full terminal navigation.
 * Monospace, dark blurred backdrop, traffic-light header, focus trap, command history.
 */
export function CommandTerminal({ isOpen, onClose }: CommandTerminalProps) {
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<OutputEntry[]>(INITIAL_WELCOME);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus restoration & auto-focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Small timeout ensures element is mounted and rendered
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    } else {
      previousActiveElementRef.current?.focus();
    }
  }, [isOpen]);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Focus trap
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextPointer =
        historyPointer === -1
          ? commandHistory.length - 1
          : Math.max(0, historyPointer - 1);
      setHistoryPointer(nextPointer);
      setInputVal(commandHistory[nextPointer] || "");
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyPointer === -1) return;
      const nextPointer = historyPointer + 1;
      if (nextPointer >= commandHistory.length) {
        setHistoryPointer(-1);
        setInputVal("");
      } else {
        setHistoryPointer(nextPointer);
        setInputVal(commandHistory[nextPointer]);
      }
      return;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Record in history for up/down navigation
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryPointer(-1);
    setInputVal("");

    const result = executeCommand(cmd);

    if (result.shouldClear) {
      setHistory([]);
      return;
    }

    const newEntries: OutputEntry[] = [
      { id: Date.now(), type: "command", text: `$ ${cmd}` },
      ...result.output.map((line, idx) => ({
        id: Date.now() + idx + 1,
        type: "response" as const,
        text: line,
      })),
    ];

    setHistory((prev) => [...prev, ...newEntries]);

    // Handle smooth navigation if requested
    if (result.scrollTargetId) {
      const targetEl = document.getElementById(result.scrollTargetId);
      if (targetEl) {
        setTimeout(() => {
          onClose();
          targetEl.scrollIntoView({ behavior: "smooth" });
        }, 350);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Portfolio Command Terminal"
        onKeyDown={handleKeyDown}
        className="w-full max-w-2xl bg-[#0d0d0d] border border-[#222] shadow-2xl relative flex flex-col max-h-[85vh] animate-in fade-in duration-100"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e] select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-[#ff5f56] hover:opacity-80 transition-opacity"
              aria-label="Close terminal"
              tabIndex={0}
            />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>

          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#555]">
            malek@portfolio: ~ (Ctrl+K)
          </div>

          <button
            onClick={onClose}
            className="text-[11px] font-mono text-[#666] hover:text-white px-2 py-0.5 border border-[#222] hover:border-[#444] rounded transition-colors"
            tabIndex={0}
          >
            Esc
          </button>
        </div>

        {/* Output History Area */}
        <div
          ref={scrollRef}
          className="p-5 font-mono text-[13px] leading-relaxed overflow-y-auto space-y-1 flex-1 min-h-[180px] max-h-[50vh]"
        >
          {history.map((entry) => (
            <div
              key={entry.id}
              className={
                entry.type === "command"
                  ? "text-[#7c3aed] font-bold mt-2"
                  : "text-[#ccc] whitespace-pre-wrap"
              }
            >
              {entry.text}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-5 py-3 border-t border-[#1e1e1e] bg-[#0a0a0a]"
        >
          <span className="text-[#7c3aed] font-mono text-sm font-bold">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type a command (help, whoami, projects, stack, contact)..."
            className="w-full bg-transparent text-white font-mono text-[13px] outline-none placeholder:text-[#444]"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      </div>
    </div>
  );
}
