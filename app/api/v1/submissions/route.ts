import { createSubmission, listSubmissions } from "@/lib/repo/submissionRepo";
import { fail, ok, rateLimited, readJson } from "@/lib/http";

const ROLES = new Set(["", "setup", "build-operate", "workspace", "talent", "advisory"]);
const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// GET /api/v1/submissions — the review queue.
export function GET() {
  return ok(listSubmissions());
}

// POST /api/v1/submissions — propose a record or a provider link. It waits for human review; it is never auto-published.
export async function POST(req: Request) {
  if (rateLimited(req, "submit", 5)) return fail(429, "RATE_LIMITED", "Too many submissions. Try again in a minute.");
  const body = await readJson(req);
  if (!body) return fail(400, "BAD_BODY", "Send a JSON object.");

  const s = {
    company: text(body.company), city: text(body.city), provider: text(body.provider),
    role: text(body.role), sourceUrl: text(body.sourceUrl), note: text(body.note),
  };
  if (!s.company || s.company.length > 120) return fail(400, "BAD_COMPANY", "Company is required (120 characters at most).");
  if (!s.city || s.city.length > 60) return fail(400, "BAD_CITY", "City is required (60 characters at most).");
  if (s.provider.length > 120) return fail(400, "BAD_PROVIDER", "Provider is 120 characters at most.");
  if (!ROLES.has(s.role)) return fail(400, "BAD_ROLE", "Role is not one of the allowed values.");
  if (s.note.length > 500) return fail(400, "BAD_NOTE", "Note is 500 characters at most.");
  let url: URL | null = null;
  try { url = new URL(s.sourceUrl); } catch { /* handled below */ }
  if (!url || !/^https?:$/.test(url.protocol) || s.sourceUrl.length > 500) {
    return fail(400, "BAD_SOURCE_URL", "A source link starting with http or https is required. No source, no record.");
  }
  return ok(createSubmission(s), { status: 201 });
}
