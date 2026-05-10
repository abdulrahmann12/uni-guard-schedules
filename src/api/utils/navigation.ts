export const LOGIN_ROUTE = "/login";

type NavigationHandler = (route: string, options?: { replace?: boolean }) => void;

let navigationHandler: NavigationHandler | null = null;

export const navigationRuntime = {
  replaceLocation(route: string) {
    window.location.replace(route);
  },
};

export function registerNavigationHandler(handler: NavigationHandler): () => void {
  navigationHandler = handler;

  return () => {
    if (navigationHandler === handler) {
      navigationHandler = null;
    }
  };
}

export function redirectToLogin(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname === LOGIN_ROUTE) {
    return;
  }

  if (navigationHandler) {
    navigationHandler(LOGIN_ROUTE, { replace: true });
    return;
  }

  navigationRuntime.replaceLocation(LOGIN_ROUTE);
}
