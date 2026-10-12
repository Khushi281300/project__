import { aiConfigured } from "@/lib/llm/anthropic";
import { extract } from "@/lib/services/extract";
import { fail, ok, rateLimited, readJson } from "@/lib/http";

// POST /api/v1/extract { text } — AI reads a pasted article and proposes the fields of a submission.
export async function POST(req: Request) {
  if (!aiConfigured()) return fail(503, "AI_NOT_CONFIGURED", "AI extraction is off on this deployment. Fill the form by hand.");
  if (rateLimited(req, "extract")) return fail(429, "RATE_LIMITED", "Too many requests. Try again in a minute.");
  const body = await readJson(req);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (text.length < 80 || text.length > 20_000) {
    return fail(400, "BAD_TEXT", "Paste between 80 and 20,000 characters of article text.");
  }
  try {
    return ok(await extract(text));
  } catch {
    return fail(502, "AI_FAILED", "The AI could not read that text. Fill the form by hand.");
  }
}
