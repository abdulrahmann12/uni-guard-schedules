import type { AuthSession } from "../types";

export const AUTH_STORAGE_KEY = "uniguard.auth.session";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function getStoredAuthSession(): AuthSession | null {
  try {
    const rawSession = getStorage()?.getItem(AUTH_STORAGE_KEY);
    return rawSession ? (JSON.parse(rawSession) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function setStoredAuthSession(session: AuthSession): void {
  try {
    getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage failures so request handling remains non-blocking.
  }
}

export function clearStoredAuthSession(): void {
  try {
    getStorage()?.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage failures so logout never blocks the UI.
  }
}

export function getStoredAccessToken(): string | null {
  return getStoredAuthSession()?.accessToken ?? null;
}

export function isAuthSessionExpired(session: AuthSession | null = getStoredAuthSession()): boolean {
  if (!session?.expiresAt) {
    return false;
  }

  const expiresAt = Date.parse(session.expiresAt);
  return Number.isFinite(expiresAt) ? expiresAt <= Date.now() : false;
}

export function hasStoredValidAuthSession(): boolean {
  const session = getStoredAuthSession();
  return Boolean(session?.accessToken) && !isAuthSessionExpired(session);
}