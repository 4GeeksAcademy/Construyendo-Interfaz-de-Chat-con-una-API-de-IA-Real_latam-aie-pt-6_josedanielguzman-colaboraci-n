type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;

  if (!apiKey || !model) {
    return Response.json(
      { error: "Falta configurar GROQ_API_KEY o GROQ_MODEL en .env." },
      { status: 500 },
    );
  }

  let body: { messages?: ChatMessage[] };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "La solicitud no es JSON válido." },
      { status: 400 },
    );
  }

  const messages = body.messages;

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > 40 ||
    !messages.every(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    )
  ) {
    return Response.json(
      { error: "La lista de mensajes no es válida." },
      { status: 400 },
    );
  }

  try {
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          max_completion_tokens: 2048,
        }),
      },
    );

    // Groq puede devolver un cuerpo vacío o no-JSON (por ejemplo, un 502 de
    // su pasarela). Parseamos de forma defensiva para no propagar un error.
    const raw = await groqResponse.text();
    let result: {
      error?: { message?: string };
      choices?: { message?: { content?: unknown } }[];
      usage?: unknown;
    } | null = null;

    if (raw) {
      try {
        result = JSON.parse(raw);
      } catch {
        result = null;
      }
    }

    if (!groqResponse.ok) {
      return Response.json(
        {
          error:
            result?.error?.message ??
            `Groq rechazó la solicitud (HTTP ${groqResponse.status}).`,
        },
        { status: groqResponse.status },
      );
    }

    const reply = result?.choices?.[0]?.message?.content;

    if (typeof reply !== "string") {
      return Response.json(
        { error: "Groq respondió sin texto." },
        { status: 502 },
      );
    }

    return Response.json({
      reply,
      usage: result?.usage ?? null,
    });
  } catch {
    return Response.json(
      { error: "No se pudo conectar con Groq." },
      { status: 502 },
    );
  }
}