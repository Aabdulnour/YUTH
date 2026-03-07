"use client";

import { useAuthUser, type AuthStatus } from "@/lib/auth/useAuthUser";

interface UsePrivateRouteResult {
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

export function usePrivateRoute(): UsePrivateRouteResult {
  const { status, user } = useAuthUser({ redirectTo: "/auth?mode=login" });

  return {
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated" && Boolean(user),
    userId: user?.id ?? null,
  };
}
