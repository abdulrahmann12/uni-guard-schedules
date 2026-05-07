export type UUID = string;
export type ISODate = string;
export type ISOTime = string;
export type ISOInstant = string;

export type SortDirection = "ASC" | "DESC";
export type RequestDeduplicationMode = "join" | "cancel-previous" | "none";
export type RequestLockState = "idle" | "pending" | "cooldown";

export interface RequestFingerprintInput {
  method?: string;
  url?: string;
  baseURL?: string;
  params?: unknown;
  data?: unknown;
  resourceId?: string | number | null;
  key?: string;
}

export interface RequestDeduplicationOptions {
  enabled?: boolean;
  mode?: RequestDeduplicationMode;
  cooldownMs?: number;
  key?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface BackendErrorResponse {
  timestamp?: ISOInstant;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  validationErrors?: ValidationError[];
}

export interface BackendPaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  currentPage?: number;
  page?: number;
  first?: boolean;
  last?: boolean;
}

export interface NormalizedPaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface ServiceSuccessResponse<T> {
  data: T;
  error: null;
  success: true;
}

export interface ServiceErrorResponse {
  data: null;
  error: ApiError;
  success: false;
}

export type ServiceResponse<T> = ServiceSuccessResponse<T> | ServiceErrorResponse;

export interface ApiErrorInit {
  message: string;
  status?: number;
  backendMessage?: string;
  path?: string;
  timestamp?: ISOInstant;
  validationErrors?: ValidationError[];
  code?: string;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly backendMessage?: string;
  readonly path?: string;
  readonly timestamp?: ISOInstant;
  readonly validationErrors: ValidationError[];
  readonly code?: string;
  readonly isNetworkError: boolean;
  readonly isTimeoutError: boolean;

  constructor(init: ApiErrorInit) {
    super(init.message);

    this.name = "ApiError";
    this.status = init.status;
    this.backendMessage = init.backendMessage;
    this.path = init.path;
    this.timestamp = init.timestamp;
    this.validationErrors = init.validationErrors ?? [];
    this.code = init.code;
    this.isNetworkError = init.isNetworkError ?? false;
    this.isTimeoutError = init.isTimeoutError ?? false;

    if (init.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = init.cause;
    }
  }
}