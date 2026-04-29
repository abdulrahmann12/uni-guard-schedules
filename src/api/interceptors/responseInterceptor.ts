import type { AxiosInstance } from "axios";

import { clearStoredAuthSession } from "../utils/authStorage";
import { logApiError, normalizeApiError } from "../utils/errorHandler";
import { redirectToLogin } from "../utils/navigation";

export function applyResponseInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const apiError = normalizeApiError(error);

      if (apiError.status === 401 && apiError.code !== "AUTH_MISSING" && apiError.code !== "AUTH_EXPIRED") {
        clearStoredAuthSession();
        redirectToLogin();
      }

      logApiError(apiError);

      return Promise.reject(apiError);
    },
  );
}