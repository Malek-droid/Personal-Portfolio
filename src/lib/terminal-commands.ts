export interface CommandResult {
  output: string[];
  shouldClear?: boolean;
  scrollTargetId?: string;
}

export interface TerminalCommand {
  description: string;
  run: (args?: string[]) => CommandResult;
}

const WHOAMI_TEXT = [
  "Malek Ben Salah",
  "Software Engineering graduate (FSM, 2026), now in my first year of a Master's",
  "in Information Systems Engineering. I build full-stack platforms with applied AI.",
  "Open to part-time, internship & freelance.",
];

const PROJECTS_DATA = [
  "▪ HRcoM: Enterprise HR & internship management platform with AI CV ranking (Groq LLaMA 3.1 + vector embeddings) [React, TypeScript, Node.js, MongoDB, Groq, Socket.io]",
  "▪ CHROFA: AI-powered multi-tenant booking SaaS for service businesses [React 19, TanStack Start, Node.js, MongoDB, Redis, Groq]",
  "▪ AI Model Drift & Observability Monitoring System: End-to-end drift monitoring for financial fraud detection [Python, pandas, SciPy, scikit-learn, React, TypeScript, Recharts]",
  "▪ ThinkBoard: MERN-stack note-taking app with rate limiting via Upstash [MongoDB, Express.js, React, Node.js, Tailwind CSS]",
  "▪ InternsHive: Full-stack internship platform with auth and CRUD [HTML, CSS, JavaScript, Node.js, Express.js, SQLite]",
  "▪ JobQuest: Professional networking platform [HTML, CSS, JavaScript]",
];

const STACK_TEXT = [
  "Languages: Python, TypeScript, JavaScript (also studied: Java, C#, C++, C)",
  "Frontend: React 19, TanStack Start, Tailwind CSS, Vite, Recharts, HTML/CSS",
  "Backend: Node.js, Express.js, REST APIs, Socket.io, JWT, Zod, Swagger/OpenAPI, BullMQ",
  "AI / ML / Data: Groq (LLaMA), Ollama, Vector Embeddings, Cosine Similarity, face-api.js, pandas, NumPy, SciPy, scikit-learn",
  "Databases: MongoDB, MySQL, SQLite, Redis",
  "Tools & Testing: Git, GitHub, Postman, Jest, Playwright, Docker, Puppeteer, Cloudinary",
];

const CONTACT_DATA = [
  "Contact Details:",
  "  EMAIL:    malekbensalah056@gmail.com",
  "  PHONE:    +216 93 113 619",
  "  LINKEDIN: linkedin.com/in/malek-bensalah-a2307b295",
  "  GITHUB:   github.com/Malek-droid",
  "  LOCATION: Monastir, Tunisia",
  "→ Scrolling to Contact section...",
];

const SUDO_HIRE_TEXT = [
  "[sudo] authenticating session...",
  "checking recruiter permissions... verified.",
  "access granted: priority candidate unlocked.",
  "→ opening Contact section...",
];

export const TERMINAL_COMMANDS: Record<string, TerminalCommand> = {
  help: {
    description: "lists all commands with descriptions",
    run: () => ({
      output: [
        "Available commands:",
        ...Object.entries(TERMINAL_COMMANDS).map(
          ([name, cmd]) => `  ${name.padEnd(18)} - ${cmd.description}`
        ),
      ],
    }),
  },
  whoami: {
    description: "short summary of me",
    run: () => ({
      output: WHOAMI_TEXT,
    }),
  },
  projects: {
    description: "lists my projects",
    run: () => ({
      output:
        PROJECTS_DATA.length > 0
          ? ["Projects:", ...PROJECTS_DATA]
          : ["no projects added yet"],
    }),
  },
  stack: {
    description: "lists the technologies shown on the page",
    run: () => ({
      output: STACK_TEXT,
    }),
  },
  contact: {
    description: "prints contact details and scrolls to the Contact section",
    run: () => ({
      output: CONTACT_DATA,
      scrollTargetId: "contact",
    }),
  },
  "sudo hire malek": {
    description: "playful shortcut to hire Malek and scroll to Contact",
    run: () => ({
      output: SUDO_HIRE_TEXT,
      scrollTargetId: "contact",
    }),
  },
  clear: {
    description: "clears the output history",
    run: () => ({
      output: [],
      shouldClear: true,
    }),
  },
};

/**
 * Executes user command string and returns output lines.
 * Never throws on unexpected inputs.
 */
export function executeCommand(rawInput: string): CommandResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { output: [] };
  }

  const normalized = trimmed.toLowerCase();

  // Direct match (including multi-word commands like "sudo hire malek")
  if (TERMINAL_COMMANDS[normalized]) {
    return TERMINAL_COMMANDS[normalized].run();
  }

  // Check prefix match
  const parts = trimmed.split(/\s+/);
  const baseCmd = parts[0].toLowerCase();
  if (TERMINAL_COMMANDS[baseCmd]) {
    return TERMINAL_COMMANDS[baseCmd].run(parts.slice(1));
  }

  return {
    output: [`command not found: ${trimmed}. Type help.`],
  };
}
