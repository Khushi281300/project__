// Thin client for the Anthropic Messages API. The key stays on the server; the browser never sees it.
// ANTHROPIC_BASE_URL lets a gateway or a test stub stand in for the real API.
const endpoint = () => `${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`;

export const aiConfigured = (): boolean => Boolean(process.env.ANTHROPIC_API_KEY);

export class AiError extends Error {}

export async function complete(opts: { system: string; user: string; maxTokens?: number }): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AiError("AI is not configured");

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: opts.maxTokens ?? 500,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new AiError(`AI request failed with status ${res.status}`);

  const body = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (body.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
  if (!text) throw new AiError("AI returned no text");
  return text;
}
