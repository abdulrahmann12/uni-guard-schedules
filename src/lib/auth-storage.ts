import type { AuthSession } from "../api/types";
import {
  AUTH_STORAGE_KEY,
  clearStoredAuthSession,
  getStoredAccessToken,
  getStoredAuthSession,
  hasStoredValidAuthSession,
  isAuthSessionExpired,
  setStoredAuthSession,
} from "../api/utils";

export { AUTH_STORAGE_KEY };

export const AUTH_EXPIRED_EVENT = "uniguard:auth-expired";

export type AuthExpiredReason = "expired" | "unauthorized" | "missing";

export function getAuthSession(): AuthSession | null {
  return getStoredAuthSession();
}

export function setAuthSession(session: AuthSession): void {
  setStoredAuthSession(session);
}

export function clearAuthSession(): void {
  clearStoredAuthSession();
}

export function getAccessToken(): string | null {
  return getStoredAccessToken();
}

export function hasSessionExpired(session: AuthSession | null = getAuthSession()): boolean {
  return isAuthSessionExpired(session);
}

export function hasValidAuthSession(): boolean {
  return hasStoredValidAuthSession();
}

export function emitAuthExpired(reason: AuthExpiredReason): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { reason } }));
}