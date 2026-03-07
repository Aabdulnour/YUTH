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
      <main className="min-h-screen bg-white px-6 py-16 text-[#171412]">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#e6e0d8] bg-[#faf8f6] p-8">
          <p className="text-sm text-[#5f5953]">Checking your session...</p>
        </div>
      </main>
    );
  }

  if (status === "authenticated") {
    return (
      <main className="min-h-screen bg-white px-6 py-16 text-[#171412]">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#e6e0d8] bg-[#faf8f6] p-8">
          <p className="text-sm text-[#5f5953]">Redirecting to your MapleMind account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-[#171412]" style={{ fontFamily: "'Inter', 'Avenir Next', 'Segoe UI', sans-serif" }}>
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-bold tracking-[0.2em] text-[#151311]">
            MAPLEMIND
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[#d4cec8] px-4 py-2 text-sm font-semibold text-[#2a2521] transition hover:border-[#b8b2ac] hover:bg-[#f7f5f3]"
          >
            Back to home
          </Link>
        </header>

        <section className="mt-10 grid gap-6 rounded-[28px] border border-[#e6e0d8] bg-[#0c0a09] p-7 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div className="rounded-2xl border border-[#2a2520] bg-[#141210] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6e68]">Your account</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl">
              Sign in or create your MapleMind account.
            </h1>
            <p className="mt-4 max-w-xl text-base text-[#9a9290]">
              Pick up where you left off, or build your profile in about two minutes.
            </p>
            <ul className="mt-6 space-y-2">
              {[
                "Tax credits and benefits matched to your profile",
                "Province-specific eligibility — not generic advice",
                "Prioritized actions for your situation this week",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-[#a09890]">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#c82233] text-[9px] font-bold text-white">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#2a2520] bg-[#141210] p-6">
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-[#2e2826] bg-[#1c1917] p-1">
              <button
                type="button"
                onClick={() => updateMode("login")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-white text-[#151311]" : "text-[#857d77] hover:bg-[#2a2520]"
                  }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => updateMode("signup")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-white text-[#151311]" : "text-[#857d77] hover:bg-[#2a2520]"
                  }`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-[#b8b0a8]">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#2e2826] bg-[#1c1917] px-4 py-3 text-white placeholder-[#5a524c] outline-none transition focus:border-[#c82233]"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#b8b0a8]">Password</span>
                <input
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#2e2826] bg-[#1c1917] px-4 py-3 text-white placeholder-[#5a524c] outline-none transition focus:border-[#c82233]"
                  placeholder="At least 8 characters"
                />
              </label>

              {errorMessage ? (
                <p className="rounded-xl border border-[#4a1a1e] bg-[#1e0d10] px-3 py-2 text-sm text-[#f08090]">{errorMessage}</p>
              ) : null}

              {infoMessage ? (
                <p className="rounded-xl border border-[#1a3a28] bg-[#0d1e16] px-3 py-2 text-sm text-[#6dbf90]">{infoMessage}</p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#c82233] px-4 py-3 font-bold text-white shadow-[0_0_16px_rgba(200,34,51,0.35)] transition hover:bg-[#b01e2d] disabled:cursor-not-allowed disabled:opacity-70"
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
