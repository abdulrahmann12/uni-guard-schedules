import type { ApiError, ServiceResponse } from "@/api";

export function unwrapServiceResponse<T>(response: ServiceResponse<T>): T {
  if (response.success) {
    return response.data;
  }

  throw response.error;
}

export function isApiError(error: unknown): error is ApiError {
  return Boolean(error && typeof error === "object" && (error as ApiError).name === "ApiError");
}