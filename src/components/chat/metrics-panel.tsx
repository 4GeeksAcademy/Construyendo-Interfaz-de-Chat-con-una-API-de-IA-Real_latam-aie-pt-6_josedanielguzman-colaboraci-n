import { Activity, ChevronRight, Coins, Cpu, Hash } from "lucide-react"
import { estimateCost, formatCost, getPricing, type SessionUsage } from "@/lib/chat"
import type { ReactNode } from "react"

const COST_REFERENCE = 0.01

type MetricsPanelProps = {
  open: boolean
  model: string
  usage: SessionUsage
  onClose: () => void
}

export function MetricsPanel({ open, model, usage, onClose }: MetricsPanelProps) {
  const cost = estimateCost(usage, model)
  const pricing = getPricing(model)
  const average = usage.requests > 0 ? Math.round(usage.totalTokens / usage.requests) : 0
  const promptShare = usage.totalTokens > 0 ? (usage.promptTokens / usage.totalTokens) * 100 : 0
  const completionShare = usage.totalTokens > 0 ? (usage.completionTokens / usage.totalTokens) * 100 : 0
  const costShare = Math.min((cost / COST_REFERENCE) * 100, 100)
  const fmt = (n: number) => n.toLocaleString("es-ES")

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-background/60 backdrop-blur-sm transition-opacity duration-300 ease-out lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        id="metrics-panel"
        aria-label="Métricas de uso"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 right-0 z-40 w-80 overflow-hidden border-l border-border bg-sidebar transition-all duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0 lg:w-80" : "translate-x-full lg:w-0 lg:border-l-0"
        }`}
      >
        <div className="flex h-full w-80 flex-col gap-6 overflow-y-auto p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-card-foreground">Métricas de la sesión</h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-300 ease-out hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
              <span className="sr-only">Ocultar métricas</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Tag icon={<Cpu className="size-3" />}>{model}</Tag>
            <Tag icon={<Activity className="size-3" />}>
              {fmt(usage.requests)} {usage.requests === 1 ? "petición" : "peticiones"}
            </Tag>
          </div>

          <section className="flex flex-col gap-3 rounded-2xl bg-card/70 p-4" aria-labelledby="tokens-heading">
            <div className="flex items-center justify-between">
              <h3 id="tokens-heading" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Hash className="size-3.5" aria-hidden="true" />
                Tokens totales
              </h3>
              <span className="font-mono text-lg font-semibold tabular-nums text-card-foreground">
                {fmt(usage.totalTokens)}
              </span>
            </div>
            <div
              className="flex h-2 overflow-hidden rounded-full bg-secondary"
              role="img"
              aria-label={`Prompt ${Math.round(promptShare)}%, completado ${Math.round(completionShare)}%`}
            >
              <span className="h-full bg-chart-1 transition-all duration-500 ease-out" style={{ width: `${promptShare}%` }} />
              <span className="h-full bg-chart-2 transition-all duration-500 ease-out" style={{ width: `${completionShare}%` }} />
            </div>
            <dl className="flex flex-col gap-2 text-xs">
              <LegendRow color="bg-chart-1" label="Prompt" value={fmt(usage.promptTokens)} />
              <LegendRow color="bg-chart-2" label="Completado" value={fmt(usage.completionTokens)} />
              <LegendRow color="bg-chart-4" label="Media / petición" value={fmt(average)} />
            </dl>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl bg-card/70 p-4" aria-labelledby="cost-heading">
            <div className="flex items-center justify-between gap-2">
              <h3 id="cost-heading" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Coins className="size-3.5" aria-hidden="true" />
                Coste estimado
              </h3>
              <span className="rounded-full bg-success/10 px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-success ring-1 ring-success/20">
                {formatCost(cost)}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label="Coste respecto a 0,01 $"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(costShare)}
            >
              <span
                className="block h-full rounded-full bg-success transition-all duration-500 ease-out"
                style={{ width: `${Math.max(costShare, cost > 0 ? 2 : 0)}%` }}
              />
            </div>
            {pricing ? (
              <dl className="flex flex-col gap-2 text-xs">
                <LegendRow color="bg-chart-1" label="Entrada / 1M" value={`${pricing.input.toFixed(3)} $`} />
                <LegendRow color="bg-chart-2" label="Salida / 1M" value={`${pricing.output.toFixed(3)} $`} />
              </dl>
            ) : (
              <p className="text-xs leading-[1.6] text-muted-foreground">
                Sin tarifa pública para este modelo en GroqCloud.
              </p>
            )}
            <p className="text-xs leading-[1.6] text-muted-foreground">
              Referencia: 0,01 $. Tarifas de console.groq.com/docs/models.
            </p>
          </section>
        </div>
      </aside>
    </>
  )
}

function Tag({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-accent/15">
      <span aria-hidden="true">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  )
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <span aria-hidden="true" className={`size-2 rounded-full ${color}`} />
        {label}
      </dt>
      <dd className="font-mono tabular-nums text-foreground">{value}</dd>
    </div>
  )
}
