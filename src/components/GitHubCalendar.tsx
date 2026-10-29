/**
 * GitHubCalendar — client-only GitHub contribution graph.
 * Uses react-github-calendar. Renders only after mount (no SSR).
 * Height reserved so the page doesn't jump. Silent on fetch failure.
 */
import { Component, useEffect, useState, type ReactNode, type ErrorInfo } from "react";
import { GitHubCalendar as GitHubCalendarLib } from "react-github-calendar";

/* ── Named constants ── */
const GITHUB_USERNAME = "malekbensalah";

/**
 * Five colour levels from near-black to site violet #7c3aed.
 * Library format: { dark: [level0, level1, level2, level3, level4] }.
 */
const GITHUB_THEME_COLORS = ["#0d0d0d", "#1e1a2e", "#3b1f6b", "#5c28b3", "#7c3aed"] as const;

/* ── Error boundary (render nothing on fetch failure) ── */
class CalendarErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) { return { hasError: true }; }
  componentDidCatch(_: Error, __: ErrorInfo) { /* silent */ }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/* ── Calendar component ── */
function CalendarInner() {
  return (
    <GitHubCalendarLib
      username={GITHUB_USERNAME}
      theme={{ dark: [...GITHUB_THEME_COLORS] }}
      colorScheme="dark"
      blockSize={10}
      blockRadius={2}
      blockMargin={3}
      fontSize={10}
      throwOnError={false}
      style={{
        color: "#555",
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        maxWidth: "100%",
      }}
    />
  );
}

/* ── Public export ── */
export function GitHubCalendar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    // Reserve height so the page never jumps while loading
    return <div style={{ minHeight: "120px", width: "100%" }} aria-hidden />;
  }

  return (
    <div style={{ minHeight: "120px", width: "100%", overflowX: "auto" }}>
      <CalendarErrorBoundary>
        <CalendarInner />
      </CalendarErrorBoundary>
    </div>
  );
}
