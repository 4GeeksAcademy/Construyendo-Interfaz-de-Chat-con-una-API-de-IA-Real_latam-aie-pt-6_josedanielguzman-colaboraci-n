"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Ocurrió un error.");
      }

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: data.reply },
      ]);
      if (data.usage) setUsage(data.usage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar el mensaje.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Chat con Groq</h1>

      {usage && (
        <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          Tokens → prompt: <strong>{usage.prompt_tokens ?? 0}</strong> ·
          completion: <strong>{usage.completion_tokens ?? 0}</strong> · total:{" "}
          <strong>{usage.total_tokens ?? 0}</strong>
        </p>
      )}

      <section className="flex flex-1 flex-col gap-3" aria-live="polite">
        {messages.map((message, index) => (
          <p
            key={index}
            className={`max-w-[85%] whitespace-pre-wrap rounded-xl p-3 ${
              message.role === "user"
                ? "self-end bg-blue-600 text-white"
                : "self-start bg-gray-100 text-gray-900"
            }`}
          >
            <strong>{message.role === "user" ? "Tú: " : "Asistente: "}</strong>
            {message.content}
          </p>
        ))}

        {loading && <p className="text-gray-500">Groq está respondiendo…</p>}
        {error && <p className="text-red-600">{error}</p>}
      </section>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escribe un mensaje…"
          className="min-w-0 flex-1 rounded-lg border px-4 py-3"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-3 text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}