export type Role = "user" | "assistant";

export type Message = {
  role: Role;
  content: string;
};

export type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type SessionUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requests: number;
};

export const EMPTY_SESSION: SessionUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  requests: 0,
};

export const STORAGE_KEY = "groq-chat-session-v1";

// Precio por 1M de tokens del modelo qwen/qwen3.8-27b (ver console.groq.com/docs/models)
export const PRICE_INPUT_PER_M = 0.8;
export const PRICE_OUTPUT_PER_M = 4.0;

export function estimateCost(usage: SessionUsage): number {
  return (
    (usage.promptTokens / 1_000_000) * PRICE_INPUT_PER_M +
    (usage.completionTokens / 1_000_000) * PRICE_OUTPUT_PER_M
  );
}

export function formatCost(value: number): string {
  return value < 0.0001 ? "<$0.0001" : `$${value.toFixed(4)}`;
}

export function addUsage(session: SessionUsage, usage: Usage): SessionUsage {
  return {
    promptTokens: session.promptTokens + (usage.prompt_tokens ?? 0),
    completionTokens:
      session.completionTokens + (usage.completion_tokens ?? 0),
    totalTokens: session.totalTokens + (usage.total_tokens ?? 0),
    requests: session.requests + 1,
  };
}

export type StoredSession = {
  messages: Message[];
  usage: SessionUsage;
};

export function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!Array.isArray(parsed.messages) || !parsed.usage) return null;
    return {
      messages: parsed.messages.filter(
        (m): m is Message =>
          !!m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      ),
      usage: { ...EMPTY_SESSION, ...parsed.usage },
    };
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage lleno o bloqueado: se ignora silenciosamente
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}