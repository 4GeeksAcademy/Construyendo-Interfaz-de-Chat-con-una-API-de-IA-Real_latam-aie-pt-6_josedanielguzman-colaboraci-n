export const MODEL = "qwen/qwen3.8-27b";
export const STORAGE_KEY = "groq-chat-session-v1";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

// La respuesta snake_case de Groq se adapta a este formato en el cliente.
export type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type SessionUsage = Usage & {
  requests: number;
  cost: number;
};

export type Session = {
  messages: Message[];
  usage: SessionUsage;
};

export type ModelPricing = {
  input: number;
  output: number;
};

// Tarifas en USD por millón de tokens publicadas en console.groq.com/docs/models.
export const MODEL_PRICING: Record<string, ModelPricing> = {
  "openai/gpt-oss-120b": { input: 0.15, output: 0.6 },
  "openai/gpt-oss-20b": { input: 0.075, output: 0.3 },
  "openai/gpt-oss-safeguard-20b": { input: 0.075, output: 0.3 },
  "meta-llama/llama-prompt-guard-2-22m": { input: 0.03, output: 0.03 },
  "meta-llama/llama-prompt-guard-2-86m": { input: 0.04, output: 0.04 },
  "qwen/qwen3.8-27b": { input: 0.8, output: 4.0 },
};

export const EMPTY_SESSION: SessionUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  requests: 0,
  cost: 0,
};

export function getPricing(model: string): ModelPricing | null {
  return MODEL_PRICING[model] ?? null;
}

export function estimateCost(usage: Usage, model: string): number {
  const pricing = getPricing(model);
  if (!pricing) return 0;
  return (
    (usage.promptTokens / 1_000_000) * pricing.input +
    (usage.completionTokens / 1_000_000) * pricing.output
  );
}

export function addUsage(
  current: SessionUsage,
  usage: Usage,
  model: string = MODEL,
): SessionUsage {
  return {
    requests: current.requests + 1,
    promptTokens: current.promptTokens + usage.promptTokens,
    completionTokens: current.completionTokens + usage.completionTokens,
    totalTokens: current.totalTokens + usage.totalTokens,
    cost: current.cost + estimateCost(usage, model),
  };
}

export function formatCost(value: number): string {
  return value < 0.0001 ? "<$0.0001" : `$${value.toFixed(6)}`;
}

function isMessage(value: unknown): value is Message {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string"
  );
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function loadSession(): Session {
  if (typeof window === "undefined") {
    return { messages: [], usage: { ...EMPTY_SESSION } };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { messages: [], usage: { ...EMPTY_SESSION } };

    const parsed = JSON.parse(raw) as Partial<Session>;
    const previousUsage = (parsed.usage ?? {}) as Partial<SessionUsage>;
    const usage: SessionUsage = {
      requests: toNumber(previousUsage.requests),
      promptTokens: toNumber(previousUsage.promptTokens),
      completionTokens: toNumber(previousUsage.completionTokens),
      totalTokens: toNumber(previousUsage.totalTokens),
      cost: toNumber(previousUsage.cost),
    };

    // Completa el coste para las sesiones antiguas, guardadas antes de tenerlo.
    if (usage.cost === 0 && usage.requests > 0) {
      usage.cost = estimateCost(usage, MODEL);
    }

    return {
      messages: Array.isArray(parsed.messages)
        ? parsed.messages.filter(isMessage)
        : [],
      usage,
    };
  } catch {
    return { messages: [], usage: { ...EMPTY_SESSION } };
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // El almacenamiento puede estar lleno o deshabilitado por el navegador.
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignora el almacenamiento no disponible.
  }
}
