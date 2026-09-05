/**
 * Centralized API configuration.
 *
 * In development, we call the real backend directly.
 * In production (Vercel), we use an empty string so that Next.js rewrites
 * the /api/* requests to the backend via next.config.ts (no CORS issues).
 */
export const API_BASE_URL = process.env.NODE_ENV === "development"
  ? "https://145.241.114.68.nip.io"
  : "";
