import type { ServiceResponse, Settings, SettingsRequest } from "../types";
import { performRequest } from "../utils/request";

const SETTINGS_ENDPOINT = "/api/settings";

async function getSettings(): Promise<ServiceResponse<Settings>> {
  return performRequest<Settings>({
    url: SETTINGS_ENDPOINT,
    method: "GET",
  });
}

async function updateSettings(payload: SettingsRequest): Promise<ServiceResponse<Settings>> {
  return performRequest<Settings>({
    url: SETTINGS_ENDPOINT,
    method: "PUT",
    data: payload,
  });
}

export const settingsService = {
  getSettings,
  updateSettings,
};