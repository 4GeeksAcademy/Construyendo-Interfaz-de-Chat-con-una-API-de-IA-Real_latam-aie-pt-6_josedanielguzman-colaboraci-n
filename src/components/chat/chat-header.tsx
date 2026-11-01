import { ChevronRight, Plus, Sparkles } from "lucide-react"

type ChatHeaderProps = {
  model: string
  metricsOpen: boolean
  onToggleMetrics: () => void
  onNewConversation: () => void
}

export function ChatHeader({ model, metricsOpen, onToggleMetrics, onNewConversation }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/60 backdrop-blur-[10px] supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-accent ring-1 ring-accent/20"
          >
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight text-card-foreground">Chat con Groq</h1>
            <p className="truncate font-mono text-xs text-muted-foreground">{model}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onNewConversation}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-all duration-300 ease-out hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nueva conversación</span>
            <span className="sr-only sm:hidden">Nueva conversación</span>
          </button>
          <button
            type="button"
            onClick={onToggleMetrics}
            aria-expanded={metricsOpen}
            aria-controls="metrics-panel"
            className="inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-300 ease-out hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronRight
              aria-hidden="true"
              className={`size-4 transition-transform duration-300 ease-out ${metricsOpen ? "" : "rotate-180"}`}
            />
            <span className="sr-only">{metricsOpen ? "Ocultar métricas" : "Mostrar métricas"}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
