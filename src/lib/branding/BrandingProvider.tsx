import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Theme = "light" | "dark";

interface Branding {
  appName: string;
  appTagline: string;
  logoDataUrl: string | null;
  university: string;
  department: string;
  examPeriod: string;
}

interface BrandingCtx extends Branding {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  updateBranding: (patch: Partial<Branding>) => void;
  resetBranding: () => void;
}

const DEFAULT_BRANDING: Branding = {
  appName: "InvigiCore",
  appTagline: "Smart Exam Invigilation",
  logoDataUrl: null,
  university: "Cairo University",
  department: "Faculty of Engineering",
  examPeriod: "Final Exams — Spring 2026",
};

const STORAGE_KEY = "invigicore.branding.v1";
const THEME_KEY = "invigicore.theme.v1";

const Ctx = createContext<BrandingCtx | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_BRANDING;
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const raw = localStorage.getItem(THEME_KEY) as Theme | null;
      if (raw === "dark" || raw === "light") return raw;
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(branding)); } catch {}
    document.title = `${branding.appName} · ${branding.appTagline}`;
  }, [branding]);

  const value = useMemo<BrandingCtx>(() => ({
    ...branding,
    theme,
    toggleTheme: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    setTheme: setThemeState,
    updateBranding: (patch) => setBranding((prev) => ({ ...prev, ...patch })),
    resetBranding: () => setBranding(DEFAULT_BRANDING),
  }), [branding, theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBranding() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBranding must be used inside BrandingProvider");
  return c;
}