import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

import type { AuthSession, CurrentSession, LoginRequest } from "@/api";
import { authService } from "@/services";
import { getAuthSession } from "@/lib/auth-storage";
import { unwrapServiceResponse } from "@/utils/serviceResponse";

interface AuthContextValue {
  session: AuthSession | null;
  user: CurrentSession | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  isLoggingIn: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadCurrentSession(): Promise<CurrentSession> {
  return unwrapServiceResponse(await authService.getCurrentSession());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());

  useEffect(() => {
    setSession(getAuthSession());
  }, [location.pathname]);

  const sessionQuery = useQuery({
    queryKey: ["auth", "session", session?.accessToken],
    queryFn: loadCurrentSession,
    enabled: Boolean(session?.accessToken),
  });

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const authSession = unwrapServiceResponse(await authService.login(payload));
      const currentUser = await queryClient.fetchQuery({
        queryKey: ["auth", "session", authSession.accessToken],
        queryFn: loadCurrentSession,
      });

      return { authSession, currentUser };
    },
    onSuccess: ({ authSession }) => {
      setSession(authSession);
      navigate("/dashboard", { replace: true });
    },
  });

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
    queryClient.removeQueries({ queryKey: ["auth"] });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: sessionQuery.data ?? null,
      isAuthenticated: Boolean(session?.accessToken && sessionQuery.data),
      isRestoring: Boolean(session?.accessToken) && sessionQuery.isLoading,
      isLoggingIn: loginMutation.isPending,
      login: loginMutation.mutateAsync,
      logout,
    }),
    [loginMutation.isPending, loginMutation.mutateAsync, logout, session, sessionQuery.data, sessionQuery.isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}