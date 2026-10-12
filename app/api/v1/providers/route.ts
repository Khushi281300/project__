import { listProviders } from "@/lib/repo/providerRepo";
import { ok } from "@/lib/http";

// GET /api/v1/providers — every provider with its verified and claimed link counts.
export function GET() {
  return ok(listProviders(), { cacheSeconds: 60 });
}
