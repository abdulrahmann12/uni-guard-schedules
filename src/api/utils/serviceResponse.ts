import { type ApiError, type ServiceResponse } from "../types";

export function createSuccessResponse<T>(data: T): ServiceResponse<T> {
  return {
    data,
    error: null,
    success: true,
  };
}

export function createErrorResponse<T>(error: ApiError): ServiceResponse<T> {
  return {
    data: null,
    error,
    success: false,
  };
}