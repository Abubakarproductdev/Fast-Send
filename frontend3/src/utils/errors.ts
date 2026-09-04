/**
 * Centralized error parsing and user-friendly message mapping.
 */

export class AppError extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Unable to reach the server. Check your connection and try again.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ApiError extends AppError {
  constructor(message: string, statusCode: number, code = 'API_ERROR') {
    super(message, code, statusCode);
    this.name = 'ApiError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class UploadError extends AppError {
  failedCount: number;
  successCount: number;

  constructor(message: string, successCount: number, failedCount: number) {
    super(message, 'UPLOAD_ERROR');
    this.name = 'UploadError';
    this.successCount = successCount;
    this.failedCount = failedCount;
  }
}

const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

export function parseFirebaseError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code && FIREBASE_ERROR_MAP[code]) {
    return FIREBASE_ERROR_MAP[code];
  }
  return (error as Error)?.message || 'Authentication failed. Please try again.';
}

export function parseApiErrorResponse(status: number, body: unknown): string {
  if (typeof body === 'object' && body !== null) {
    const detail = (body as { detail?: string | { msg?: string }[] }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d) => d.msg || String(d)).join('. ');
    }
    const message = (body as { message?: string }).message;
    if (message) return message;
  }
  switch (status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'You are not authorized. Please sign in again.';
    case 404: return 'The requested resource was not found.';
    case 409: return 'This action conflicts with existing data.';
    case 413: return 'File is too large to upload.';
    case 422: return 'Invalid data submitted.';
    case 500: return 'Server error. Please try again later.';
    case 503: return 'Service temporarily unavailable. Try again shortly.';
    default: return `Request failed (${status}). Please try again.`;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof TypeError && error.message.includes('Network request failed')) {
    return new NetworkError().message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
}
