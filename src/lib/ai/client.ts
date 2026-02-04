type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export class AiHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly requestId: string | null;
  readonly bodyText: string | null;

  constructor(params: {
    status: number;
    statusText: string;
    url: string;
    requestId: string | null;
    bodyText: string | null;
  }) {
    super(`AI HTTP ${params.status} (${params.statusText || "unknown"})`);
    this.name = "AiHttpError";
    this.status = params.status;
    this.statusText = params.statusText;
    this.url = params.url;
    this.requestId = params.requestId;
    this.bodyText = params.bodyText;
  }
}

type CallAiParams = {
  apiUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature: number;
  timeoutMs: number;
  useResponseFormat?: boolean;
};

type Aishop24hErrorPayload = {
  error?: {
    message?: string;
  };
};

const extractErrorMessage = (bodyText: string | null) => {
  if (!bodyText) return null;
  try {
    const parsed = JSON.parse(bodyText) as Aishop24hErrorPayload;
    const message = parsed?.error?.message;
    return typeof message === "string" ? message : null;
  } catch {
    return null;
  }
};

const getAllowedTemperatureFromBody = (bodyText: string | null) => {
  const message = extractErrorMessage(bodyText) ?? bodyText;
  if (!message) return null;
  const match = message.match(
    /invalid\s+temperature[^0-9]*only\s+([0-9]+(?:\.[0-9]+)?)\s+is\s+allowed/i,
  );
  if (!match?.[1]) return null;
  const allowed = Number(match[1]);
  return Number.isFinite(allowed) ? allowed : null;
};

const extractJsonFromText = (text: string) => {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return null;
};

type AiResponseChoice = {
  message?: { content?: string };
  text?: string;
};

type AiResponse = {
  choices?: AiResponseChoice[];
  content?: string;
  output?: string;
};

const extractContent = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as AiResponse;
  const content =
    data.choices?.[0]?.message?.content ??
    data.choices?.[0]?.text ??
    data.content ??
    data.output;
  if (typeof content === "string") return content;
  return null;
};

export const callAishop24h = async ({
  apiUrl,
  apiKey,
  model,
  messages,
  temperature,
  timeoutMs,
  useResponseFormat,
}: CallAiParams): Promise<unknown> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const doRequest = async (temp: number) => {
      const body: Record<string, unknown> = {
        model,
        messages,
        temperature: temp,
      };
      if (useResponseFormat) {
        body.response_format = { type: "json_object" };
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const requestId =
          response.headers.get("x-request-id") ??
          response.headers.get("x-correlation-id") ??
          null;
        const bodyText = await response.text().catch(() => null);
        return {
          ok: false as const,
          error: new AiHttpError({
            status: response.status,
            statusText: response.statusText,
            url: apiUrl,
            requestId,
            bodyText,
          }),
        };
      }

      const payload = await response.json();
      const content = extractContent(payload);
      if (content) {
        const jsonText = extractJsonFromText(content);
        if (jsonText) {
          return { ok: true as const, value: JSON.parse(jsonText) };
        }
        return { ok: true as const, value: content };
      }
      return { ok: true as const, value: payload };
    };

    const first = await doRequest(temperature);
    if (first.ok) return first.value;

    const allowedTemperature =
      first.error.status === 400
        ? getAllowedTemperatureFromBody(first.error.bodyText)
        : null;
    if (
      allowedTemperature != null &&
      allowedTemperature !== temperature &&
      Number.isFinite(allowedTemperature)
    ) {
      const second = await doRequest(allowedTemperature);
      if (second.ok) return second.value;
      throw second.error;
    }

    throw first.error;
  } finally {
    clearTimeout(timer);
  }
};
