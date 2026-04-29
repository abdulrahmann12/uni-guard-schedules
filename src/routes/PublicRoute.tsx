import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/state/auth";

export function PublicRoute() {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}