"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import { loadPersistedUserProfile } from "@/lib/persistence/profile-store";
import { getRecommendations } from "@/lib/recommendations/engine";
import type { AskAIResponseBody, ChatHistoryMessage } from "@/types/ai";
import type { UserProfile } from "@/types/profile";

const SUGGESTED_PROMPTS: string[] = [
  "Should I open an FHSA or TFSA first?",
  "What benefits can I claim as a student?",
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

function AskAIContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSent = useRef(false);

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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

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
          userId,
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

  // Auto-submit topic from query param (from mindmap)
  useEffect(() => {
    if (!canAsk || hasAutoSent.current) return;
    const topic = searchParams.get("topic");
    if (topic) {
      hasAutoSent.current = true;
      void submitQuestion(topic);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAsk, searchParams]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitQuestion();
  };

  if (isLoading || profile === undefined) {
    return (
      <AppShell activePath="/ask-ai">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-[#5f5953]">
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
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-[#5f5953]">
          Redirecting to onboarding...
        </div>
      </AppShell>
    );
  }

  if (!profile || !recommendations) {
    return (
      <AppShell activePath="/ask-ai">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7b72]">Ask AI</p>
          <h1 className="mt-2 text-2xl font-bold text-[#151311]">Complete onboarding to open your chat</h1>
          <p className="mt-2 text-sm text-[#5f5953]">
            YUTH AI needs your saved profile to provide grounded, personalized guidance.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/onboarding" className="rounded-xl bg-[#c82233] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_16px_rgba(200,34,51,0.2)] transition hover:bg-[#b01e2d]">
              Complete onboarding
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-[#e2dbd4] bg-white px-6 py-2.5 text-sm font-medium text-[#151311] transition hover:border-[#d0c9c1]"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <AppShell activePath="/ask-ai" maxWidthClassName="max-w-5xl">
      {/* ── Compact header row ── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7b72]">Ask AI</p>
          <h1 className="mt-0.5 text-xl font-bold text-[#151311]">Chat about your profile and next steps</h1>
        </div>
        <p className="rounded-full bg-[#eef6ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2f7a47]">
          {recommendations.matchedBenefits.length} programs in context
        </p>
      </div>

      {/* ── Chat container ── */}
      <div className="flex flex-col rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-[#f5f2ee] shadow-[0_4px_16px_rgba(20,15,12,0.06)]">
        {/* Messages area */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
          {/* Empty state with suggested prompts */}
          {!hasMessages ? (
            <div className="flex h-full flex-col items-center justify-center px-4 py-8">
              <div className="mb-6 text-center">
                <p className="text-lg font-semibold text-[#151311]">What can I help with?</p>
                <p className="mt-1 text-sm text-[#5f5953]">
                  Ask about taxes, benefits, savings, or your personalized next steps.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    disabled={isSending || !canAsk}
                    onClick={() => {
                      void submitQuestion(promptText);
                    }}
                    className="rounded-xl border border-[#e2dbd4] bg-white px-4 py-2.5 text-sm text-[#3f3a35] transition hover:border-[#c82233] hover:text-[#c82233] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <article
                      className={`max-w-[75%] rounded-2xl p-4 ${
                        isUser
                          ? "bg-[#c82233] text-white"
                          : "border border-[#e2dbd4] bg-white text-[#151311]"
                      }`}
                    >
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isUser ? "text-white/70" : "text-[#9a7b72]"}`}>
                        {isUser ? "You" : "YUTH AI"}
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      {!isUser && message.metaLabel ? (
                        <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[#9a7b72]">{message.metaLabel}</p>
                      ) : null}

                      {!isUser && sourcePills.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {sourcePills.map((source) =>
                            source.url ? (
                              <a
                                key={source.label}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-[#e2dbd4] bg-[#faf8f6] px-2 py-0.5 text-[10px] font-medium text-[#5f5953] transition hover:border-[#d0c9c1]"
                              >
                                {source.label}
                              </a>
                            ) : (
                              <span
                                key={source.label}
                                className="rounded-full border border-[#e2dbd4] bg-[#faf8f6] px-2 py-0.5 text-[10px] font-medium text-[#5f5953]"
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
              })}

              {isSending ? (
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl border border-[#e2dbd4] bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a7b72]">YUTH AI</p>
                    <span className="mt-1.5 inline-block animate-pulse text-sm text-[#5f5953]">
                      Reviewing your profile and matched programs...
                    </span>
                  </div>
                </div>
              ) : null}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* ── Input bar ── */}
        <form onSubmit={onSubmit} className="flex gap-2 border-t border-[#e2dbd4] bg-white p-3" style={{ borderRadius: "0 0 1rem 1rem" }}>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={!canAsk || isSending}
            className="flex-1 rounded-xl border border-[#e2dbd4] bg-[#faf8f6] px-4 py-2.5 text-sm outline-none transition focus:border-[#c82233] focus:ring-1 focus:ring-[#c82233]/20 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Ask about taxes, benefits, savings, rent, debt, or next steps..."
          />
          <button
            type="submit"
            disabled={!question.trim() || !canAsk || isSending}
            className="rounded-xl bg-[#c82233] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b01e2d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "..." : "Send"}
          </button>
        </form>

        {error ? (
          <p className="border-t border-[#f0cfd3] bg-[#fff1f2] px-4 py-2 text-sm text-[#c82233]" style={{ borderRadius: "0 0 1rem 1rem" }}>
            {error}
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

export default function AskAIPage() {
  return (
    <Suspense fallback={
      <AppShell activePath="/ask-ai">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-[#5f5953]">Loading…</div>
      </AppShell>
    }>
      <AskAIContent />
    </Suspense>
  );
}
