import { Sparkles } from "lucide-react"
import type { Message } from "@/lib/chat"
import { AssistantMessage, type Feedback } from "./assistant-message"

const SUGGESTIONS = [
  "Explícame la computación cuántica en 3 frases",
  "Escribe un correo profesional para pedir una reunión",
  "Dame ideas para un proyecto con Next.js",
]

type MessageListProps = {
  messages: Message[]
  loading: boolean
  error: string
  feedback: Record<number, Feedback>
  onRegenerate: (index: number) => void
  onFeedback: (index: number, value: Feedback) => void
  onSuggestion: (text: string) => void
}

export function MessageList({
  messages,
  loading,
  error,
  feedback,
  onRegenerate,
  onFeedback,
  onSuggestion,
}: MessageListProps) {
  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center animate-in fade-in duration-500">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-2xl bg-primary/20 text-accent ring-1 ring-accent/20"
        >
          <Sparkles className="size-5" />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-balance text-card-foreground">
            ¿En qué puedo ayudarte hoy?
          </h2>
          <p className="text-[15px] leading-[1.6] text-muted-foreground">
            Respuestas ultrarrápidas impulsadas por Groq.
          </p>
        </div>
        <ul className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => onSuggestion(suggestion)}
                className="w-full rounded-2xl bg-card/70 px-4 py-2.5 text-left text-sm text-muted-foreground ring-1 ring-border transition-all duration-300 ease-out hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <ul className="flex flex-col gap-6">
        {messages.map((message, index) => (
          <li key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            {message.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-[20px] rounded-br-md bg-primary px-4 py-3 text-[15px] leading-[1.6] break-words whitespace-pre-wrap text-white shadow-lg shadow-primary/10 md:max-w-[75%]">
                  <span className="sr-only">Tú: </span>
                  {message.content}
                </div>
              </div>
            ) : (
              <AssistantMessage
                content={message.content}
                feedback={feedback[index]}
                canRegenerate={!loading}
                onRegenerate={() => onRegenerate(index)}
                onFeedback={(value) => onFeedback(index, value)}
              />
            )}
          </li>
        ))}
      </ul>

      {loading && (
        <div className="flex items-center gap-3 animate-in fade-in duration-300 md:gap-4" role="status">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-accent ring-1 ring-accent/15"
          >
            <Sparkles className="size-3.5 animate-pulse" />
          </span>
          <div className="flex items-center gap-1.5 rounded-[18px] bg-card/70 px-5 py-4" aria-hidden="true">
            <span className="size-1.5 animate-bounce rounded-full bg-accent/80 [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-accent/80 [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-accent/80" />
          </div>
          <span className="sr-only">Groq está respondiendo…</span>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm leading-[1.6] text-destructive ring-1 ring-destructive/20 animate-in fade-in duration-300"
        >
          {error}
        </p>
      )}
    </div>
  )
}
