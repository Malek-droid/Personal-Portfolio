/**
 * GitHub Configuration
 * Centralized configuration for all GitHub components and links.
 */
export const GITHUB_USERNAME =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GITHUB_USERNAME) ||
  "malekbensalah";

/** Cache duration in milliseconds (10 minutes) */
export const GITHUB_CACHE_TTL_MS = 10 * 60 * 1000;
