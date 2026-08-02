/**
 * fetchWithTimeout
 *
 * React Native / Hermes does NOT support `AbortSignal.timeout()` (it's undefined).
 * This utility replicates the same behaviour using AbortController + setTimeout,
 * which works on all JS engines including Hermes.
 *
 * Usage:
 *   const response = await fetchWithTimeout(url, { method: 'POST', ... }, 8000);
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer); // Always clear timer — prevents memory leaks
  }
}
