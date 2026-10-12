import { ask } from "@/lib/services/ask";
import { fail, ok, rateLimited, readJson } from "@/lib/http";

// POST /api/v1/ask { question } — retrieval over the ledger, then an AI answer that cites records.
export async function POST(req: Request) {
  if (rateLimited(req, "ask")) return fail(429, "RATE_LIMITED", "Too many questions. Try again in a minute.");
  const body = await readJson(req);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (question.length < 3 || question.length > 300) {
    return fail(400, "BAD_QUESTION", "Send a question between 3 and 300 characters.");
  }
  return ok(await ask(question));
}
