"use client";

import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message-list";
import { MetricsPanel } from "@/components/chat/metrics-panel";
import type { Feedback } from "@/components/chat/assistant-message";
import {
  addUsage,
  clearSession,
  EMPTY_SESSION,
  loadSession,
  type Message,
  MODEL,
  saveSession,
  type SessionUsage,
  type Usage,
} from "@/lib/chat";

type ChatResponse = {
  error?: string;
  reply?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [usage, setUsage] = useState<SessionUsage>({ ...EMPTY_SESSION });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, Feedback>>({});
  const [metricsOpen, setMetricsOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // localStorage solo se consulta tras el primer render para coincidir con SSR.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const session = loadSession();
    setMessages(session.messages);
    setUsage(session.usage);
    setMetricsOpen(window.matchMedia("(min-width: 1024px)").matches);
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    saveSession({ messages, usage });
  }, [messages, usage, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  function handleNewConversation() {
    setMessages([]);
    setUsage({ ...EMPTY_SESSION });
    setFeedback({});
    setInput("");
    setError("");
    clearSession();
    inputRef.current?.focus();
  }

  async function requestReply(history: Message[]) {
    setMessages(history);
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const raw = await response.text();
      let data: ChatResponse = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as ChatResponse;
        } catch {
          throw new Error(`El servidor devolvió una respuesta no válida (HTTP ${response.status}).`);
        }
      }

      if (!response.ok) {
        throw new Error(data.error ?? `El servidor respondió con el código ${response.status}.`);
      }
      if (typeof data.reply !== "string" || data.reply.length === 0) {
        throw new Error("La respuesta no contiene texto. Inténtalo de nuevo.");
      }

      setMessages([...history, { role: "assistant", content: data.reply }]);
      const serverUsage = data.usage;
      if (serverUsage) {
        const normalizedUsage: Usage = {
          promptTokens: serverUsage.prompt_tokens ?? 0,
          completionTokens: serverUsage.completion_tokens ?? 0,
          totalTokens: serverUsage.total_tokens ?? 0,
        };
        setUsage((previous) => addUsage(previous, normalizedUsage, MODEL));
      }
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "No se pudo contactar con el servidor. Comprueba tu conexión e inténtalo de nuevo."
          : err instanceof Error
            ? err.message
            : "No se pudo enviar el mensaje.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void requestReply([...messages, { role: "user", content: text }]);
  }

  function handleRegenerate(index: number) {
    if (loading) return;
    setFeedback((previous) => {
      const next = { ...previous };
      delete next[index];
      return next;
    });
    void requestReply(messages.slice(0, index));
  }

  function handleFeedback(index: number, value: Feedback) {
    setFeedback((previous) => {
      const next = { ...previous };
      if (next[index] === value) delete next[index];
      else next[index] = value;
      return next;
    });
  }

  function handleSuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <ChatHeader
          model={MODEL}
          metricsOpen={metricsOpen}
          onToggleMetrics={() => setMetricsOpen((open) => !open)}
          onNewConversation={handleNewConversation}
        />
        <div
          className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 md:px-6"
          role="log"
          aria-live="polite"
          aria-label="Mensajes"
        >
          <MessageList
            messages={messages}
            loading={loading}
            error={error}
            feedback={feedback}
            onRegenerate={handleRegenerate}
            onFeedback={handleFeedback}
            onSuggestion={handleSuggestion}
          />
          <div ref={bottomRef} />
        </div>
        <ChatInput
          value={input}
          loading={loading}
          inputRef={inputRef}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      </main>
      <MetricsPanel
        open={metricsOpen}
        model={MODEL}
        usage={usage}
        onClose={() => setMetricsOpen(false)}
      />
    </div>
  );
}
