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
  "Final-year Software Engineering student at FSM (graduating June 2026),",
  "specializing in full-stack development with applied AI.",
  "Experienced across MERN, REST APIs, and LLM integration.",
];

const PROJECTS_DATA = [
  "▪ HRcoM: Enterprise HR & internship management platform with AI CV ranking (Groq LLaMA 3.1 + vector embeddings) [React, TypeScript, Node.js, MongoDB, Groq, Socket.io]",
  "▪ ThinkBoard: MERN-stack note-taking app with rate limiting via Upstash [MongoDB, Express.js, React, Node.js, Tailwind CSS]",
  "▪ InternsHive: Full-stack internship platform with auth and CRUD [HTML, CSS, JavaScript, Node.js, Express.js, SQLite]",
  "▪ JobQuest: Professional networking platform [HTML, CSS, JavaScript]",
];

const STACK_TEXT = [
  "Languages: Java, C#, C++, Python, C, JavaScript, TypeScript",
  "Front-End: React, HTML, CSS, Tailwind CSS, DaisyUI",
  "Back-End: Node.js, Express.js, REST APIs, Socket.io, JWT, Swagger",
  "AI & Data: Groq, LLaMA 3.1, MongoDB, MySQL, SQLite",
  "DevOps & Tools: Git, GitHub, Postman, Jest, Playwright, Docker, Cloudinary, Puppeteer",
];

const CONTACT_DATA = [
  "Contact Details:",
  "  EMAIL:    malekbensalah056@gmail.com",
  "  PHONE:    +216 93 113 619",
  "  LINKEDIN: linkedin.com/in/malek-bensalah-a2307b295",
  "  GITHUB:   github.com/malekbensalah",
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
