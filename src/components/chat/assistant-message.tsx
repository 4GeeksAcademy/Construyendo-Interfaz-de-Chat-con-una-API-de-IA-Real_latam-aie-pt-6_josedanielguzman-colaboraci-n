"use client"

import { useState, type ReactNode } from "react"
import { Check, Copy, RefreshCw, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react"

export type Feedback = "up" | "down"

type AssistantMessageProps = {
  content: string
  feedback?: Feedback
  canRegenerate: boolean
  onRegenerate: () => void
  onFeedback: (value: Feedback) => void
}

export function AssistantMessage({
  content,
  feedback,
  canRegenerate,
  onRegenerate,
  onFeedback,
}: AssistantMessageProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="group flex gap-3 md:gap-4">
      <span
        aria-hidden="true"
        className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-accent ring-1 ring-accent/15"
      >
        <Sparkles className="size-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="rounded-[18px] bg-card/70 px-5 py-4 text-[15px] leading-[1.6] break-words whitespace-pre-wrap text-foreground md:text-base">
          <span className="sr-only">IA: </span>
          {content}
        </div>

        <div className="mt-1.5 flex items-center gap-0.5 pl-1 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <ActionButton label={copied ? "Copiado" : "Copiar al portapapeles"} onClick={handleCopy}>
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </ActionButton>
          <ActionButton label="Regenerar respuesta" onClick={onRegenerate} disabled={!canRegenerate}>
            <RefreshCw className="size-3.5" />
          </ActionButton>
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
          <ActionButton label="Me gusta" onClick={() => onFeedback("up")} pressed={feedback === "up"}>
            <ThumbsUp className={`size-3.5 ${feedback === "up" ? "fill-current" : ""}`} />
          </ActionButton>
          <ActionButton label="No me gusta" onClick={() => onFeedback("down")} pressed={feedback === "down"}>
            <ThumbsDown className={`size-3.5 ${feedback === "down" ? "fill-current" : ""}`} />
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

type ActionButtonProps = {
  label: string
  onClick: () => void
  children: ReactNode
  disabled?: boolean
  pressed?: boolean
}

function ActionButton({ label, onClick, children, disabled, pressed }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      title={label}
      className={`inline-flex size-8 items-center justify-center rounded-lg transition-all duration-300 ease-out hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 ${
        pressed ? "text-accent" : "text-muted-foreground"
      }`}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  )
}
