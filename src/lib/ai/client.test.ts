import { afterEach, describe, expect, it, vi } from "vitest";
import { callAishop24h } from "./client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("callAishop24h", () => {
  it("retries with temperature=1 when provider enforces it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: "400",
              type: "invalid_params",
              message: "invalid temperature: only 1 is allowed for this model",
            },
          }),
          { status: 400 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"ok":true}' } }],
          }),
          { status: 200 },
        ),
      );

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await callAishop24h({
      apiUrl: "https://aishop24h.com/v1/chat/completions",
      apiKey: "test-key",
      model: "moonshotai/kimi-k2.5",
      messages: [{ role: "user", content: "hi" }],
      temperature: 0.3,
      timeoutMs: 2000,
      useResponseFormat: false,
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(firstBody.temperature).toBe(0.3);

    const secondBody = JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string);
    expect(secondBody.temperature).toBe(1);
  });
});
