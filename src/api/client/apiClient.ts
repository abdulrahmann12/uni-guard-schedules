import axios from "axios";

import { applyRequestInterceptor } from "../interceptors/requestInterceptor";
import { applyResponseInterceptor } from "../interceptors/responseInterceptor";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = configuredApiBaseUrl || "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

applyRequestInterceptor(apiClient);
applyResponseInterceptor(apiClient);