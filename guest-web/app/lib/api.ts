/**
 * Centralized API configuration.
 *
 * We now use an empty string "" so that all fetch() calls go to the SAME domain
 * (e.g. fast-send-three.vercel.app/api/v1/...).
 * Next.js (Vercel) will intercept these /api/ requests and proxy them securely
 * to the Azure backend, completely bypassing any mobile DNS blocking.
 */
export const API_BASE_URL = process.env.NODE_ENV === "development" 
  ? "http://192.168.10.4:8000" 
  : "";
