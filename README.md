# Habla con la Máquina — Interfaz de Chat con una API de IA real

Prototipo de interfaz de chat en **React / Next.js (App Router)** conectado a la
API de **Groq**, que mide en tiempo real el consumo de tokens y las métricas de
sesión, con persistencia en `localStorage`.

## Funcionalidades

- Chat con el modelo `qwen/qwen3.8-27b` de Groq.
- Historial completo de la conversación, con mensajes del usuario y de la IA
  visualmente diferenciados.
- Panel de métricas: tokens de prompt, de completado y totales acumulados,
  media por petición y coste estimado.
- Persistencia de la sesión en `localStorage` (sobrevive a una recarga).
- Botón «Nueva conversación» que limpia el estado y el `localStorage`.
- Estados de carga y errores legibles para el usuario.
- La API key **nunca** llega al navegador: solo se usa en la API Route.

## Requisitos

- Node.js 20 o superior.
- Una cuenta gratuita en [Groq](https://console.groq.com/) y una API key.

## Configuración

1. Copia el archivo de ejemplo y rellena tus valores:

```bash
cp .env.example .env
```

2. Edita `.env`:

```env
GROQ_API_KEY=tu_api_key_aqui
GROQ_MODEL=qwen/qwen3.8-27b
```

> **Nota sobre el modelo:** el enunciado del curso indica `qwen/qwen3.6-27b`.
> Ese modelo ya no está disponible en Groq; se usa `qwen/qwen3.8-27b`, el más
> parecido disponible en el plan gratuito.
>
> **Nota sobre la variable:** se usa `GROQ_API_KEY` (sin prefijo
> `NEXT_PUBLIC_`) a propósito, para que la clave no se exponga en el bundle del
> navegador.

3. Opcional — rate limiting global entre réplicas (recomendado en producción).
   Crea una base de datos gratuita en [Upstash](https://console.upstash.com) y
   añade:

```env
UPSTASH_REDIS_REST_URL=https://tu-instancia.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu_token
```

Sin estas variables la app funciona igual, con un limitador en memoria.

## Ejecución

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm start        # Servidor de producción
npm run lint     # ESLint
npx tsc --noEmit # Comprobación de tipos
```

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Interfaz del chat y panel de métricas
│   └── api/chat/route.ts     # API Route: proxy seguro hacia Groq
└── lib/
    └── chat.ts               # Tipos, acumulación de uso, coste y localStorage
```

## Cómo se cumplen los requisitos del brief

| Requisito | Implementación |
| --- | --- |
| Interfaz de chat (campo + botón) | `<form>` con `<input>` y botón «Enviar» en `page.tsx` |
| API key en variable de entorno | `process.env.GROQ_API_KEY`; `.env` ignorado por Git |
| `fetch` sin SDK, cabeceras manuales | `Authorization: Bearer` + `Content-Type: application/json` |
| Historial completo en cada llamada | Se envía el array completo de mensajes |
| `async/await` | `handleSubmit` con `try/catch/finally` |
| Indicador de carga | `loading` + «Groq está respondiendo…» |
| Errores legibles | Parseo defensivo: nunca se muestra un error técnico |
| `useState` | Mensajes, input, carga, error y métricas |
| `useEffect` de carga desde `localStorage` | Efecto que llama a `loadSession()` tras hidratar |
| `useEffect` de guardado | Guarda en `localStorage` tras cada cambio |
| Tokens de prompt / completado / totales | Desde el objeto `usage`, acumulados con `addUsage()` |
| Métrica adicional | Modelo, media por petición y coste estimado |
| Persistencia tras recarga | `saveSession` / `loadSession` |
| Borrar conversación | Botón «Nueva conversación» |

## Sobre v0.dev

Inicialmente, el layout de este proyecto se escribió a mano en JSX + Tailwind.
Al advertir que el proyecto requería generar la interfaz con
[v0.dev](https://v0.dev), accedí a esa plataforma, generé el diseño y copié e
integré manualmente el código en este repositorio.

El layout definitivo fue generado en v0.dev e integrado en el commit
`a6c8e81`, titulado `feat: integrar interfaz de chat de Groq`.
