"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { logSupabaseWarningOnce } from "@/lib/supabase/error-utils";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface UseAuthUserOptions {
  redirectTo?: string;
}

interface UseAuthUserResult {
  status: AuthStatus;
  user: User | null;
}

export function useAuthUser(options?: UseAuthUserOptions): UseAuthUserResult {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    const applyUser = (nextUser: User | null) => {
      if (!isMounted) {
        return;
      }

      setUser(nextUser);
      setStatus(nextUser ? "authenticated" : "unauthenticated");

      if (!nextUser && options?.redirectTo) {
        router.replace(options.redirectTo);
      }
    };

    let supabase: ReturnType<typeof getSupabaseBrowserClient>;

    try {
      supabase = getSupabaseBrowserClient();
    } catch (error) {
      logSupabaseWarningOnce("auth", "Supabase client is not configured; auth defaults to unauthenticated", error);
      queueMicrotask(() => applyUser(null));
      return;
    }

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          logSupabaseWarningOnce("auth", "Could not fetch Supabase session", error);
          applyUser(null);
          return;
        }

        applyUser(data.session?.user ?? null);
      })
      .catch((error) => {
        logSupabaseWarningOnce("auth", "Unexpected auth session check failure", error);
        applyUser(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [options?.redirectTo, router]);

  return { status, user };
}
