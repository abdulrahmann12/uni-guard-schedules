import type { BackendPaginatedResponse, NormalizedPaginatedResponse } from "../types";

export function normalizePaginatedResponse<T>(
  payload: BackendPaginatedResponse<T>,
): NormalizedPaginatedResponse<T> {
  return {
    items: Array.isArray(payload.content) ? payload.content : [],
    page:
      typeof payload.currentPage === "number"
        ? payload.currentPage
        : typeof payload.page === "number"
          ? payload.page
          : 0,
    size:
      typeof payload.size === "number"
        ? payload.size
        : Array.isArray(payload.content)
          ? payload.content.length
          : 0,
    totalItems: typeof payload.totalElements === "number" ? payload.totalElements : 0,
    totalPages: typeof payload.totalPages === "number" ? payload.totalPages : 0,
  };
}