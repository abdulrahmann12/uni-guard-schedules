export const LOGIN_ROUTE = "/login";

export function redirectToLogin(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname === LOGIN_ROUTE) {
    return;
  }

  window.location.assign(LOGIN_ROUTE);
}