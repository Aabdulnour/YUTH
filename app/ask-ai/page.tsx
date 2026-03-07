"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import { loadPersistedUserProfile } from "@/lib/persistence/profile-store";
import { getRecommendations } from "@/lib/recommendation";
import type { AskAIResponseBody, ChatHistoryMessage } from "@/types/ai";
import type { UserProfile } from "@/types/profile";

const SUGGESTED_PROMPTS: string[] = [
  "Should I open an FHSA or TFSA first?",
  "Do I need to file taxes if I made little income?",
  "What benefits can I claim as a student?",
  "How do I start building credit in Canada?",
  "What should I do first based on my profile?",
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metaLabel?: string;
}

interface SourcePill {
  label: string;
  url?: string;
}

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AskAIPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      if (!isLoading) {
        setProfile(null);
      }

      return;
    }

    let isCancelled = false;

    const loadProfile = async () => {
      const nextProfile = await loadPersistedUserProfile(userId);
      if (!isCancelled) {
        setProfile(nextProfile);
      }
    };

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isLoading, userId]);

  useEffect(() => {
    if (isAuthenticated && profile === null) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, profile, router]);

  const recommendations = useMemo(() => {
    if (!profile) {
      return null;
    }

    return getRecommendations(profile);
  }, [profile]);

  const sourcePills = useMemo(() => {
    if (!recommendations) {
      return [];
    }

    const sourceMap = new Map<string, string | undefined>();

    for (const benefit of recommendations.matchedBenefits) {
      if (benefit.sourceLabel && !sourceMap.has(benefit.sourceLabel)) {
        sourceMap.set(benefit.sourceLabel, benefit.sourceUrl);
      }
    }

    for (const action of recommendations.matchedActions) {
      if (action.sourceLabel && !sourceMap.has(action.sourceLabel)) {
        sourceMap.set(action.sourceLabel, action.sourceUrl);
      }
    }

    return Array.from(sourceMap.entries())
      .slice(0, 4)
      .map(([label, url]): SourcePill => ({ label, url }));
  }, [recommendations]);

  const canAsk = isAuthenticated && Boolean(profile && recommendations);

  const submitQuestion = async (prompt?: string) => {
    const nextQuestion = (prompt ?? question).trim();
    if (!nextQuestion || !profile || !recommendations || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: nextQuestion,
    };

    const historyForRequest: ChatHistoryMessage[] = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          recommendation: recommendations,
          question: nextQuestion,
          history: historyForRequest,
        }),
      });

      const rawData = (await response.json().catch(() => null)) as
        | (Partial<AskAIResponseBody> & { error?: string })
        | null;

      if (!response.ok || !rawData || typeof rawData.answer !== "string") {
        const errorMessage =
          rawData && typeof rawData.error === "string"
            ? rawData.error
            : "I couldn't generate an answer right now. Please try again.";
        throw new Error(errorMessage);
      }

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: rawData.answer.trim(),
        metaLabel:
          typeof rawData.metaLabel === "string"
            ? rawData.metaLabel
            : "Based on your profile and matched programs",
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (requestError) {
      const fallbackError =
        requestError instanceof Error
          ? requestError.message
          : "I couldn't generate an answer right now. Please try again.";
      setError(fallbackError);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: "assistant",
          content:
            "I hit a temporary issue while generating your personalized answer. Please try again in a moment.",
          metaLabel: "Temporary issue",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitQuestion();
  };

  if (isLoading || profile === undefined) {
    return (
      <AppShell activePath="/ask-ai">
        <div className="rounded-3xl border border-[#e8e1d9] bg-white p-8 text-lg shadow-sm">
          Loading your profile context...
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated || !userId) {
    return null;
  }

  if (profile === null) {
    return (
      <AppShell activePath="/ask-ai">
        <div className="rounded-3xl border border-[#e8e1d9] bg-white p-8 shadow-sm">
          Redirecting to onboarding...
        </div>
      </AppShell>
    );
  }

  if (!profile || !recommendations) {
    return (
      <AppShell activePath="/ask-ai">
        <div className="rounded-3xl border border-[#e8e1d9] bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">Ask AI</p>
          <h1 className="mt-2 text-3xl font-bold">Complete onboarding to open your chat</h1>
          <p className="mt-3 text-[#6f6a64]">
            MapleMind AI needs your saved profile to provide grounded, personalized guidance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/onboarding" className="rounded-2xl bg-[#f04d2d] px-6 py-3 font-semibold text-white">
              Complete onboarding
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl border border-[#d8d1c8] bg-white px-6 py-3 font-medium text-[#1c1b19]"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/ask-ai" maxWidthClassName="max-w-7xl">
      <section className="rounded-3xl border border-[#e9e2da] bg-white p-5 shadow-[0_12px_30px_rgba(35,31,26,0.06)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">Ask AI</p>
            <h1 className="mt-1 text-2xl font-bold">Chat about your profile and next steps</h1>
          </div>
          <p className="rounded-full bg-[#edf5ee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2f7a47]">
            {recommendations.matchedBenefits.length} programs in context
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((promptText) => (
            <button
              key={promptText}
              type="button"
              disabled={isSending || !canAsk}
              onClick={() => {
                void submitQuestion(promptText);
              }}
              className="rounded-xl border border-[#e6dfd8] bg-[#faf7f3] px-4 py-2 text-sm text-[#3f3a35] transition hover:border-[#d7cfc7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {promptText}
            </button>
          ))}
        </div>

        <div className="h-[62vh] min-h-[420px] space-y-4 overflow-y-auto rounded-2xl border border-[#ede6dd] bg-[#f9f6f1] p-4">
          {messages.length === 0 ? (
            <div className="max-w-2xl rounded-2xl border border-[#e4ddd5] bg-[#f4efe8] p-5 text-[#4b4642]">
              <p className="font-semibold">Start with a practical question.</p>
              <p className="mt-2 text-sm text-[#6f6a64]">
                MapleMind AI uses your profile, matched programs, and trusted source metadata to respond.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <article
                    className={`max-w-2xl rounded-2xl p-4 shadow-sm ${
                      isUser ? "bg-[#163320] text-white" : "border border-[#e5ddd4] bg-white text-[#1c1b19]"
                    }`}
                  >
                    <p className={`text-xs uppercase tracking-[0.12em] ${isUser ? "text-white/70" : "text-[#8a8580]"}`}>
                      {isUser ? "You" : "MapleMind AI"}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
                    {!isUser && message.metaLabel ? (
                      <p className="mt-3 text-xs uppercase tracking-[0.1em] text-[#7b756f]">{message.metaLabel}</p>
                    ) : null}

                    {!isUser && sourcePills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sourcePills.map((source) =>
                          source.url ? (
                            <a
                              key={source.label}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full border border-[#ddd4cb] bg-[#f8f3ed] px-2.5 py-1 text-[11px] font-medium text-[#5e5852]"
                            >
                              {source.label}
                            </a>
                          ) : (
                            <span
                              key={source.label}
                              className="rounded-full border border-[#ddd4cb] bg-[#f8f3ed] px-2.5 py-1 text-[11px] font-medium text-[#5e5852]"
                            >
                              {source.label}
                            </span>
                          )
                        )}
                      </div>
                    ) : null}
                  </article>
                </div>
              );
            })
          )}

          {isSending ? (
            <div className="flex justify-start">
              <div className="max-w-2xl rounded-2xl border border-[#e5ddd4] bg-white p-4 text-[#6f6a64] shadow-sm">
                <p className="text-xs uppercase tracking-[0.12em] text-[#8a8580]">MapleMind AI</p>
                <span className="mt-2 inline-block animate-pulse">
                  Reviewing your profile and matched programs...
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={!canAsk || isSending}
            className="flex-1 rounded-2xl border border-[#ddd6cf] bg-[#faf7f3] px-5 py-4 outline-none transition focus:border-[#f04d2d] disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Ask about taxes, benefits, savings, rent, debt, or next steps..."
          />
          <button
            type="submit"
            disabled={!question.trim() || !canAsk || isSending}
            className="rounded-2xl bg-[#f04d2d] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Thinking..." : "Send"}
          </button>
        </form>

        {error ? (
          <p className="mt-3 rounded-xl border border-[#f2d4cd] bg-[#fff2ef] px-3 py-2 text-sm text-[#b14634]">
            {error}
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}
