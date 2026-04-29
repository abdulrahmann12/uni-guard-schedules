import type { AuthResponse, CurrentSession, LoginRequest, ServiceResponse } from "../types";
import { clearStoredAuthSession, setStoredAuthSession } from "../utils/authStorage";
import { redirectToLogin } from "../utils/navigation";
import { performRequest } from "../utils/request";
import { createSuccessResponse } from "../utils/serviceResponse";

const AUTH_ENDPOINT = "/api/auth";

async function login(payload: LoginRequest): Promise<ServiceResponse<AuthResponse>> {
  const response = await performRequest<AuthResponse>({
    url: `${AUTH_ENDPOINT}/login`,
    method: "POST",
    data: payload,
  });

  if (response.success) {
    setStoredAuthSession(response.data);
  }

  return response;
}

async function getCurrentSession(): Promise<ServiceResponse<CurrentSession>> {
  return performRequest<CurrentSession>({
    url: `${AUTH_ENDPOINT}/me`,
    method: "GET",
  });
}

async function logout(): Promise<ServiceResponse<null>> {
  clearStoredAuthSession();
  redirectToLogin();
  return createSuccessResponse<null>(null);
}

export const authService = {
  login,
  getCurrentSession,
  logout,
};