// Use the computer's local IP address instead of localhost so physical phones can reach the FastAPI backend
export const API_BASE_URL = 'https://20.244.11.161.nip.io';
// Keep the QR destination on the current deployment.  The older deployment
// still contains the HTTP backend URL and fails on mobile browsers.
export const GUEST_WEBAPP_URL = 'https://fast-send-three.vercel.app';
