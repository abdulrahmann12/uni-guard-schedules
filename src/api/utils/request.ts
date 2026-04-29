import type { AxiosRequestConfig, AxiosResponse } from "axios";

import { apiClient } from "../client";
import { ApiError, type ServiceResponse } from "../types";
import { normalizeApiError } from "./errorHandler";
import { createErrorResponse, createSuccessResponse } from "./serviceResponse";

type ResponseTransformer<TResponse, TResult> = (
  data: TResponse,
  response: AxiosResponse<TResponse>,
) => TResult;

export async function performRequest<TResponse, TResult = TResponse>(
  config: AxiosRequestConfig,
  transform?: ResponseTransformer<TResponse, TResult>,
): Promise<ServiceResponse<TResult>> {
  try {
    const response = await apiClient.request<TResponse>(config);
    const data = transform ? transform(response.data, response) : (response.data as TResult);

    return createSuccessResponse(data);
  } catch (error) {
    const apiError = error instanceof ApiError ? error : normalizeApiError(error);
    return createErrorResponse<TResult>(apiError);
  }
}