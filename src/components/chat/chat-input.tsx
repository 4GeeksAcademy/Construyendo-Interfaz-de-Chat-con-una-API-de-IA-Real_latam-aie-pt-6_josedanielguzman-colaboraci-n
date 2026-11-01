"use client"

import type { FormEvent, KeyboardEvent, RefObject } from "react"
import { ArrowUp } from "lucide-react"

type ChatInputProps = {
  value: string
  loading: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
  onChange: (value: string) => void
  onSubmit: () => void
}

export function ChatInput({ value, loading, inputRef, onChange, onSubmit }: ChatInputProps) {
  const disabled = loading || value.trim() === ""

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!disabled) onSubmit()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    e.preventDefault()
    if (!disabled) onSubmit()
  }

  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-background/60 backdrop-blur-[10px] supports-[backdrop-filter]:bg-background/50">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 pt-3 pb-4 md:px-6">
        <label htmlFor="chat-input" className="sr-only">
          Mensaje
        </label>
        <div className="flex items-end gap-2 rounded-[20px] bg-card/80 p-2 pl-4 ring-1 ring-input transition-all duration-300 ease-out focus-within:ring-2 focus-within:ring-ring/60">
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje…"
            autoComplete="off"
            disabled={loading}
            className="field-sizing-content max-h-48 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] leading-[1.6] text-card-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 ease-out hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:bg-secondary disabled:text-muted-foreground disabled:shadow-none"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
            <span className="sr-only">Enviar</span>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Enter para enviar · Shift + Enter para nueva línea
        </p>
      </form>
    </div>
  )
}
