/**
 * Centralized API configuration.
 *
 * NEXT_PUBLIC_API_URL is baked in at build time by Next.js.
 * The hardcoded fallback uses the production HTTPS URL so the app
 * works on ALL devices (desktop + mobile) even if the env var is
 * missing during the Vercel build.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://20.244.11.161.nip.io";
