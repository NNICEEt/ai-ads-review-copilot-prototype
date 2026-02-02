type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type CallAiParams = {
  apiUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature: number;
  timeoutMs: number;
  useResponseFormat?: boolean;
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
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature,
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
      throw new Error(`AI request failed: ${response.status}`);
    }

    const payload = await response.json();
    const content = extractContent(payload);
    if (content) {
      const jsonText = extractJsonFromText(content);
      if (jsonText) {
        return JSON.parse(jsonText);
      }
      return content;
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
};
