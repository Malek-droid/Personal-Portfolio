import { useEffect, useState } from "react";
import { GITHUB_USERNAME, GITHUB_CACHE_TTL_MS } from "@/config/github";

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: {
    name: string;
    url: string;
  };
  payload?: {
    action?: string;
    ref?: string;
    ref_type?: string;
    size?: number;
    commits?: Array<{ message: string; sha: string }>;
    pull_request?: { title: string; html_url: string };
    issue?: { title: string; html_url: string };
  };
}

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  pushed_at: string;
  stargazers_count: number;
}

interface ActivityRow {
  id: string;
  typeLabel: string;
  typeColor: string;
  repoName: string;
  repoUrl: string;
  message: string;
  linkUrl: string;
  timeAgo: string;
}

interface UserProfile {
  public_repos: number;
  followers: number;
}

/** Cache key uses correct username — naturally busts stale "malekbensalah" cache */
const CACHE_KEY = `gh_activity_${GITHUB_USERNAME}`;

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "just now";
}

function parseEvent(event: GitHubEvent): ActivityRow {
  const repoName = event.repo.name.split("/")[1] || event.repo.name;
  const repoUrl = `https://github.com/${event.repo.name}`;
  let typeLabel = "EVENT";
  let typeColor = "text-[#888] border-[#333]";
  let message = "Activity on repository";
  let linkUrl = repoUrl;

  switch (event.type) {
    case "PushEvent":
      typeLabel = "PUSH";
      typeColor = "text-[#7c3aed] border-[#7c3aed]/40";
      if (event.payload?.commits && event.payload.commits.length > 0) {
        message = event.payload.commits[0].message.split("\n")[0];
        linkUrl = `https://github.com/${event.repo.name}/commit/${event.payload.commits[0].sha}`;
      } else {
        message = `Pushed ${event.payload?.size || 1} commit(s)`;
      }
      break;

    case "PullRequestEvent":
      typeLabel = "PR";
      typeColor = "text-[#27c93f] border-[#27c93f]/40";
      message = `${event.payload?.action || "updated"}: ${event.payload?.pull_request?.title || "Pull Request"}`;
      linkUrl = event.payload?.pull_request?.html_url || repoUrl;
      break;

    case "CreateEvent":
      typeLabel = "CREATE";
      typeColor = "text-[#ffbd2e] border-[#ffbd2e]/40";
      message = `Created ${event.payload?.ref_type || "branch"} ${event.payload?.ref || ""}`;
      break;

    case "WatchEvent":
      typeLabel = "STAR";
      typeColor = "text-[#ffbd2e] border-[#ffbd2e]/40";
      message = "Starred repository";
      break;

    case "IssuesEvent":
      typeLabel = "ISSUE";
      typeColor = "text-[#ff5f56] border-[#ff5f56]/40";
      message = `${event.payload?.action || "action"} issue: ${event.payload?.issue?.title || ""}`;
      linkUrl = event.payload?.issue?.html_url || repoUrl;
      break;

    case "ForkEvent":
      typeLabel = "FORK";
      typeColor = "text-[#a78bfa] border-[#a78bfa]/40";
      message = "Forked repository";
      break;

    default:
      typeLabel = event.type.replace("Event", "").toUpperCase();
      message = `Activity in ${repoName}`;
      break;
  }

  return {
    id: event.id,
    typeLabel,
    typeColor,
    repoName,
    repoUrl,
    message,
    linkUrl,
    timeAgo: formatRelativeTime(event.created_at),
  };
}

/** Convert a repo to an ActivityRow for the repos-fallback view */
function repoToRow(repo: GitHubRepo): ActivityRow {
  const langColors: Record<string, string> = {
    TypeScript: "text-[#3178c6] border-[#3178c6]/40",
    JavaScript: "text-[#ffbd2e] border-[#ffbd2e]/40",
    Python: "text-[#3572A5] border-[#3572A5]/40",
    HTML: "text-[#e34c26] border-[#e34c26]/40",
    CSS: "text-[#563d7c] border-[#563d7c]/40",
    Java: "text-[#b07219] border-[#b07219]/40",
    "C++": "text-[#f34b7d] border-[#f34b7d]/40",
    Rust: "text-[#dea584] border-[#dea584]/40",
  };
  const lang = repo.language || "CODE";
  const color = langColors[lang] || "text-[#7c3aed] border-[#7c3aed]/40";

  return {
    id: String(repo.id),
    typeLabel: lang.toUpperCase().slice(0, 8),
    typeColor: color,
    repoName: repo.name,
    repoUrl: repo.html_url,
    message: repo.description || "No description",
    linkUrl: repo.html_url,
    timeAgo: formatRelativeTime(repo.pushed_at),
  };
}

export function GitHubActivityTable() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReposFallback, setIsReposFallback] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadActivity() {
      // 1. Try local cache first
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          const age = Date.now() - (cached.timestamp || 0);
          if (cached.rows && cached.rows.length > 0) {
            setRows(cached.rows);
            if (cached.profile) setUserProfile(cached.profile);
            if (cached.isReposFallback) setIsReposFallback(true);
            setIsCached(true);
            setLoading(false);

            // If cache is fresh, skip network fetch entirely
            if (age < GITHUB_CACHE_TTL_MS) {
              return;
            }
          }
        }
      } catch {
        // storage disabled or corrupted, proceed to fetch
      }

      // 2. Fetch events + user profile in parallel
      try {
        const [eventsRes, userRes] = await Promise.allSettled([
          fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=10`),
          fetch(`https://api.github.com/users/${GITHUB_USERNAME}`),
        ]);

        if (isCancelled) return;

        let parsedRows: ActivityRow[] = [];
        let profileData: UserProfile | null = null;
        let usedReposFallback = false;

        if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
          const data: GitHubEvent[] = await eventsRes.value.json();
          if (Array.isArray(data)) {
            parsedRows = data.slice(0, 7).map(parseEvent);
          }
        } else if (eventsRes.status === "fulfilled" && eventsRes.value.status === 403) {
          setErrorMsg("API rate limit reached");
        }

        if (userRes.status === "fulfilled" && userRes.value.ok) {
          const u = await userRes.value.json();
          profileData = {
            public_repos: u.public_repos ?? 0,
            followers: u.followers ?? 0,
          };
        }

        // 3. Repos fallback — shown when user works mostly on private repos
        //    and the events API returns nothing useful.
        if (parsedRows.length === 0) {
          try {
            const reposRes = await fetch(
              `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=7&type=public`
            );
            if (!isCancelled && reposRes.ok) {
              const repos: GitHubRepo[] = await reposRes.json();
              if (Array.isArray(repos) && repos.length > 0) {
                parsedRows = repos.map(repoToRow);
                usedReposFallback = true;
              }
            }
          } catch {
            // repos fetch failed, leave parsedRows empty
          }
        }

        if (isCancelled) return;

        if (parsedRows.length > 0) {
          setRows(parsedRows);
          setIsReposFallback(usedReposFallback);
          if (profileData) setUserProfile(profileData);
          setErrorMsg(null);
          setIsCached(false);

          // Save to cache
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                timestamp: Date.now(),
                rows: parsedRows,
                profile: profileData,
                isReposFallback: usedReposFallback,
              })
            );
          } catch {
            // quota exceeded or private mode
          }
        } else {
          if (rows.length === 0) {
            setErrorMsg("No recent public activity recorded");
          }
        }
      } catch {
        if (!isCancelled) {
          if (rows.length === 0) {
            setErrorMsg("GitHub unreachable");
          }
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadActivity();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="mt-8 bg-[#0a0a0a] border border-[#1e1e1e] font-mono text-xs">
      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-[#1e1e1e] gap-3 bg-[#0d0d0d]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#888]">
            {isReposFallback ? "repos-latest.log" : "git-activity.log"} — @{GITHUB_USERNAME}
          </span>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-[#666]">
          {userProfile && (
            <span>
              <span className="text-white font-bold">{userProfile.public_repos}</span> Public Repos
            </span>
          )}
          {rows.length > 0 && (
            <span>
              <span className="text-[#7c3aed] font-bold">{rows.length}</span>{" "}
              {isReposFallback ? "Latest Repos" : "Recent Events"}
            </span>
          )}
          {isCached && (
            <span className="text-[#555] hidden sm:inline" title="Loaded from 10-minute local cache">
              ⚡ cached
            </span>
          )}
          <a
            href={`https://github.com/${GITHUB_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7c3aed] hover:text-white transition-colors"
          >
            Profile ↗
          </a>
        </div>
      </div>

      {/* Table Content */}
      <div className="divide-y divide-[#161616]">
        {loading && rows.length === 0 ? (
          // Skeleton Rows
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
              <span className="w-14 h-5 bg-[#1a1a1a] rounded" />
              <span className="w-28 h-4 bg-[#181818] rounded" />
              <span className="flex-1 h-4 bg-[#141414] rounded hidden sm:block" />
              <span className="w-16 h-3 bg-[#181818] rounded ml-auto" />
            </div>
          ))
        ) : rows.length > 0 ? (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-3 sm:gap-4 px-5 py-3.5 hover:bg-[#111] transition-colors group"
            >
              {/* Event / Language Badge */}
              <span
                className={`text-[9px] uppercase tracking-wider border px-1.5 py-0.5 rounded font-mono font-semibold flex-shrink-0 ${row.typeColor}`}
              >
                {row.typeLabel}
              </span>

              {/* Repo Name */}
              <a
                href={row.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-medium text-[12px] hover:text-[#7c3aed] transition-colors flex-shrink-0 truncate max-w-[140px] sm:max-w-[200px]"
              >
                {row.repoName}
              </a>

              <span className="text-[#333] hidden sm:inline">·</span>

              {/* Commit message / Repo description */}
              <a
                href={row.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#888] text-[11px] truncate flex-1 hover:text-[#ccc] transition-colors"
                title={row.message}
              >
                {row.message}
              </a>

              {/* Timestamp */}
              <span className="text-[#555] text-[10px] tracking-wider whitespace-nowrap ml-auto flex-shrink-0">
                {row.timeAgo}
              </span>
            </div>
          ))
        ) : (
          // Empty / Error Fallback
          <div className="p-8 text-center text-[#666]">
            <p className="text-sm text-[#888] mb-2">{errorMsg || "No recent public events found."}</p>
            <a
              href={`https://github.com/${GITHUB_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-[11px] uppercase tracking-wider text-[#7c3aed] hover:underline"
            >
              View profile directly on GitHub ↗
            </a>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="px-5 py-2.5 bg-[#0a0a0a] border-t border-[#1a1a1a] flex items-center justify-between text-[10px] text-[#555]">
        <span>
          {isReposFallback
            ? "Showing latest pushed repos — no recent public events"
            : "Auto-cached (10m TTL) · Zero client token exposure"}
        </span>
        <span className="text-[#27c93f]">● sync</span>
      </div>
    </div>
  );
}
