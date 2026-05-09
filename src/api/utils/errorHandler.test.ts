import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

import { normalizeApiError } from "./errorHandler";

function createAxiosError(options: {
  status: number;
  data: unknown;
  url: string;
  message?: string;
}): AxiosError {
  const config = {
    headers: {},
    method: "post",
    url: options.url,
  } as InternalAxiosRequestConfig;

  const response = {
    data: options.data,
    status: options.status,
    statusText: "",
    headers: {},
    config,
  } as AxiosResponse;

  return new AxiosError(options.message ?? "Request failed", undefined, config, undefined, response);
}

describe("normalizeApiError", () => {
  it("maps login 403 responses to an invalid-credentials message", () => {
    const error = createAxiosError({
      status: 403,
      data: "Forbidden",
      url: "/api/auth/login",
    });

    const apiError = normalizeApiError(error);

    expect(apiError.message).toBe("Invalid email or password.");
    expect(apiError.status).toBe(403);
    expect(apiError.backendMessage).toBe("Forbidden");
    expect(apiError.path).toBe("/api/auth/login");
  });

  it("uses plain text backend messages for non-login 403 responses", () => {
    const error = createAxiosError({
      status: 403,
      data: "Access denied by policy",
      url: "/api/rooms",
    });

    const apiError = normalizeApiError(error);

    expect(apiError.message).toBe("Access denied by policy");
    expect(apiError.status).toBe(403);
    expect(apiError.backendMessage).toBe("Access denied by policy");
    expect(apiError.path).toBe("/api/rooms");
  });
});