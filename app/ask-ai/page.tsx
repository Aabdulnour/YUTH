"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { loadUserProfile } from "@/lib/profile-storage";
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

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AskAIPage() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProfile(loadUserProfile());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const recommendations = useMemo(() => {
    if (!profile) {
      return null;
    }

    return getRecommendations(profile);
  }, [profile]);

  const canAsk = Boolean(profile && recommendations);

  const submitQuestion = async (prompt?: string) => {
    const nextQuestion = (prompt ?? question).trim();
    if (!nextQuestion || !profile || !recommendations || isLoading) {
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
    setIsLoading(true);

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
          content: "I hit a temporary issue while generating your personalized answer. Please try again in a moment.",
          metaLabel: "Temporary issue",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitQuestion();
  };

  if (profile === undefined) {
    return (
      <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-white p-6 shadow-sm">Loading your profile context...</div>
        </div>
      </main>
    );
  }

  if (!profile || !recommendations) {
    return (
      <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">AI Assistant</p>
            <h1 className="mt-2 text-4xl font-bold">Ask about my situation</h1>
            <p className="mt-4 text-lg text-[#6f6a64]">
              Complete onboarding first so MapleMind can personalize answers using your profile and matched
              programs.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/onboarding"
                className="rounded-2xl bg-[#f04d2d] px-8 py-4 text-center text-lg font-semibold text-white"
              >
                Go to onboarding
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-[#d8d1c8] bg-white px-8 py-4 text-center text-lg font-medium text-[#1c1b19]"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">AI Assistant</p>
            <h1 className="mt-2 text-4xl font-bold">Ask about my situation</h1>
            <p className="mt-2 text-sm text-[#6f6a64]">Based on your profile and matched programs</p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-2xl border border-[#d8d1c8] bg-white px-5 py-3 font-medium"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((promptText) => (
              <button
                key={promptText}
                type="button"
                disabled={isLoading || !canAsk}
                onClick={() => {
                  void submitQuestion(promptText);
                }}
                className="rounded-xl border border-[#e6dfd8] bg-[#faf7f3] px-4 py-2 text-sm text-[#3f3a35] transition hover:border-[#d7cfc7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {promptText}
              </button>
            ))}
          </div>

          <div className="min-h-[360px] space-y-4 rounded-2xl bg-[#f9f6f1] p-4">
            {messages.length === 0 ? (
              <div className="max-w-2xl rounded-2xl bg-[#f0ece6] p-4 text-[#4b4642]">
                Ask a question and I will use your profile and {recommendations.matchedBenefits.length} matched
                benefit programs to give a practical answer.
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-2xl rounded-2xl p-4 ${
                        isUser ? "bg-[#163320] text-white" : "bg-[#f4f4f2] text-[#1c1b19]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {!isUser && message.metaLabel ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.1em] text-[#7b756f]">
                          {message.metaLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="max-w-2xl rounded-2xl bg-[#f4f4f2] p-4 text-[#6f6a64]">
                  <span className="animate-pulse">Thinking through your profile and recommendations...</span>
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="mt-6 flex gap-3">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={!canAsk || isLoading}
              className="flex-1 rounded-2xl border border-[#ddd6cf] bg-[#faf7f3] px-5 py-4 outline-none transition focus:border-[#f04d2d] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Ask anything about benefits, taxes, housing, or savings..."
            />
            <button
              type="submit"
              disabled={!question.trim() || !canAsk || isLoading}
              className="rounded-2xl bg-[#163320] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Thinking..." : "Send"}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-[#b14634]">{error}</p> : null}
        </div>
      </div>
    </main>
  );
}
