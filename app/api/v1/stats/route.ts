import { facets } from "@/lib/repo/gccRepo";
import { getStats } from "@/lib/repo/statsRepo";
import { ok } from "@/lib/http";

// GET /api/v1/stats — headline counts plus the filter options.
export function GET() {
  return ok({ stats: getStats(), facets: facets() }, { cacheSeconds: 60 });
}
