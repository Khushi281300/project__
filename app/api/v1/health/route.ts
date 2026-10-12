import { aiConfigured } from "@/lib/llm/anthropic";
import { getStats } from "@/lib/repo/statsRepo";
import { ok } from "@/lib/http";

// GET /api/v1/health — liveness plus whether the AI features are switched on.
export function GET() {
  return ok({ status: "ok", ai: aiConfigured(), records: getStats().gccs });
}
