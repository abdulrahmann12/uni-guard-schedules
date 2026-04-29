import type { UUID } from "./api";

export type ThemeMode = "LIGHT" | "DARK";

export interface SettingsRequest {
  systemName: string;
  appTagline?: string;
  logoUrl?: string | null;
  theme: ThemeMode;
  universityName: string;
  department?: string | null;
  examPeriod: string;
}

export interface Settings {
  id: UUID;
  systemName: string;
  appTagline: string;
  logoUrl: string | null;
  theme: ThemeMode;
  universityName: string;
  department: string | null;
  examPeriod: string;
}