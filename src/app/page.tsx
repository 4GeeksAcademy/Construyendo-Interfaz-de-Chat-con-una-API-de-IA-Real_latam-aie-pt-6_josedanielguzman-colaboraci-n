"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  addUsage,
  clearSession,
  EMPTY_SESSION,
  estimateCost,
  formatCost,
  loadSession,
  Message,
  saveSession,
  SessionUsage,
  Usage,
} from "@/lib/chat";

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

export default function Home() {
  const initialSession = loadSession();
  const [messages, setMessages] = useState<Message[]>(
    initialSession?.messages ?? [],
  );
  const [usage, setUsage] = useState<SessionUsage>(
    initialSession?.usage ?? EMPTY_SESSION,
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  // Cargar el historial desde localStorage al montar (solo cliente).
  // Este efecto se ejecuta cuando el componente ya hidrató: lee la sesión
  // guardada y, si el estado del chat está vacío, restaura mensajes y uso.
  // La lectura de localStorage es un sistema externo y solo puede hacerse
  // en el cliente, por lo que la hidratación ocurre primero.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hydrated) return;
    const stored = loadSession();
    if (!stored) return;

    setMessages((prev) => (prev.length === 0 ? stored.messages : prev));
    setUsage((prev) =>
      prev.requests === 0 && prev.totalTokens === 0 ? stored.usage : prev,
    );
  }, [hydrated]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Guardar en localStorage tras cambios (solo si ya hidrató)
  useEffect(() => {
    if (!hydrated) return;
    saveSession({ messages, usage });
  }, [messages, usage, hydrated]);

  // Scroll automático al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

      // Leemos como texto: una respuesta vacía (500 sin cuerpo, 204, reinicio
      // del servidor) no debe romper el parseo con un error técnico.
      const raw = await response.text();
      let data: { error?: string; reply?: string; usage?: Usage | null } = {};

      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(
            `El servidor devolvió una respuesta no válida (HTTP ${response.status}). Inténtalo de nuevo.`,
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ??
            `El servidor respondió con el código ${response.status}. Inténtalo de nuevo.`,
        );
      }

      if (!raw) {
        throw new Error(
          "El servidor devolvió una respuesta vacía. Inténtalo de nuevo.",
        );
      }

      if (typeof data.reply !== "string" || data.reply.length === 0) {
        throw new Error("La respuesta no contiene texto. Inténtalo de nuevo.");
      }

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: data.reply },
      ]);

      const serverUsage = data.usage ?? null;
      if (serverUsage) setUsage((prev) => addUsage(prev, serverUsage));
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "No se pudo contactar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
        );
      } else {
        setError(
          err instanceof Error ? err.message : "No se pudo enviar el mensaje.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleNewConversation() {
    setMessages([]);
    setUsage(EMPTY_SESSION);
    setError("");
    clearSession();
  }

  const avgTokens =
    usage.requests > 0 ? Math.round(usage.totalTokens / usage.requests) : 0;
  const cost = estimateCost(usage);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Chat con Groq</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              qwen/qwen3.8-27b · Next.js App Router
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewConversation}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Nueva conversación
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 p-6">
        {/* Columna del chat */}
        <main className="flex min-w-0 flex-1 flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <section className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Escribe un mensaje para empezar. La conversación y las métricas
                se guardan en tu navegador.
              </p>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100"
                  }`}
                  aria-hidden="true"
                >
                  {message.role === "user" ? "Tú" : "IA"}
                </div>
                <p
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}

            {loading && (
              <p className="pl-11 text-sm text-zinc-500 dark:text-zinc-400">
                Groq está respondiendo…
              </p>
            )}

            {error && (
              <p className="pl-11 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div ref={bottomRef} />
          </section>

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe un mensaje…"
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </main>

        {/* Panel de métricas */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Métricas de sesión
            </h2>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Peticiones</dt>
                <dd className="font-semibold">{usage.requests}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Tokens de entrada
                </dt>
                <dd className="font-semibold">{usage.promptTokens}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Tokens de salida
                </dt>
                <dd className="font-semibold">{usage.completionTokens}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <dt className="font-medium">Tokens totales</dt>
                <dd className="font-bold">{usage.totalTokens}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Media / petición
                </dt>
                <dd className="font-semibold">{avgTokens}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Coste estimado
                </dt>
                <dd className="font-semibold">{formatCost(cost)}</dd>
              </div>
            </dl>

            <p className="border-t border-zinc-200 pt-3 text-xs leading-relaxed text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
              Los tokens provienen del campo <code>usage</code> de Groq. El coste
              se estima con $0.80/M entrada y $4.00/M salida.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

