"use client";

import type { AuthError } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { loadPersistedUserProfile } from "@/lib/persistence/profile-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

function getModeFromQuery(modeParam: string | null): AuthMode {
  return modeParam === "signup" ? "signup" : "login";
}

function formatAuthError(error: AuthError): string {
  if (!error.message) {
    return "Authentication failed. Please try again.";
  }

  if (error.message.toLowerCase().includes("invalid login")) {
    return "Incorrect email or password.";
  }

  return error.message;
}

export default function AuthPage() {
  const router = useRouter();
  const { status, user } = useAuthUser();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setMode(getModeFromQuery(params.get("mode")));
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !user) {
      return;
    }

    let isCancelled = false;

    const routeAuthenticatedUser = async () => {
      const profile = await loadPersistedUserProfile(user.id);
      if (isCancelled) {
        return;
      }

      router.replace(profile ? "/dashboard" : "/onboarding");
    };

    void routeAuthenticatedUser();

    return () => {
      isCancelled = true;
    };
  }, [router, status, user]);

  const updateMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
    setInfoMessage(null);
    router.replace(`/auth?mode=${nextMode}`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Use at least 8 characters for your password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          router.replace("/onboarding");
          return;
        }

        setInfoMessage("Account created. Check your inbox to confirm your email, then log in.");
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      router.replace("/dashboard");
    } catch (error) {
      if (typeof error === "object" && error && "message" in error) {
        setErrorMessage(formatAuthError(error as AuthError));
      } else {
        setErrorMessage("Authentication failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#0d2216] px-6 py-16 text-[#f7f0e1]">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#dcebd3]/20 bg-[#11291b] p-8">
          <p className="text-sm text-[#d4e2cf]">Checking your session...</p>
        </div>
      </main>
    );
  }

  if (status === "authenticated") {
    return (
      <main className="min-h-screen bg-[#0d2216] px-6 py-16 text-[#f7f0e1]">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#dcebd3]/20 bg-[#11291b] p-8">
          <p className="text-sm text-[#d4e2cf]">Redirecting to your MapleMind account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d2216] px-6 py-10 text-[#f7f0e1]">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-[0.16em] text-[#dcebd3] md:text-base">
            MAPLEMIND
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[#dcebd3]/30 px-4 py-2 text-sm font-medium text-[#f7f0e1] transition hover:bg-[#f7f0e1]/8"
          >
            Back to home
          </Link>
        </header>

        <section className="mt-10 grid gap-8 rounded-[28px] border border-[#dcebd3]/16 bg-gradient-to-b from-[#143121] to-[#10271a] p-8 lg:grid-cols-[1fr_0.95fr] lg:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#9fbea7]">Account access</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">Your MapleMind account, synced and secure.</h1>
            <p className="mt-5 max-w-xl text-lg text-[#d5e3d0]">
              Sign in to continue your plan or create an account to save profile progress, completed actions, and AI context.
            </p>
          </div>

          <div className="rounded-2xl border border-[#dcebd3]/18 bg-[#f7f0e1]/6 p-6">
            <div className="mb-5 flex gap-2 rounded-xl border border-[#dcebd3]/20 bg-[#0f2518] p-1">
              <button
                type="button"
                onClick={() => updateMode("login")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "login" ? "bg-[#f7f0e1] text-[#13271a]" : "text-[#d0dfcb] hover:bg-[#f7f0e1]/10"
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => updateMode("signup")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "signup" ? "bg-[#f7f0e1] text-[#13271a]" : "text-[#d0dfcb] hover:bg-[#f7f0e1]/10"
                }`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#d9e7d3]">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#dcebd3]/22 bg-[#f7f0e1]/8 px-4 py-3 outline-none transition focus:border-[#f26a2c]"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#d9e7d3]">Password</span>
                <input
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#dcebd3]/22 bg-[#f7f0e1]/8 px-4 py-3 outline-none transition focus:border-[#f26a2c]"
                  placeholder="At least 8 characters"
                />
              </label>

              {errorMessage ? (
                <p className="rounded-xl border border-[#f3b8a8]/40 bg-[#f26a2c]/12 px-3 py-2 text-sm text-[#ffd2c6]">
                  {errorMessage}
                </p>
              ) : null}

              {infoMessage ? (
                <p className="rounded-xl border border-[#c9e0cc]/40 bg-[#eef6ef]/12 px-3 py-2 text-sm text-[#d6e7d0]">
                  {infoMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#f26a2c] px-4 py-3 font-semibold text-white transition hover:bg-[#ea7a45] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
