import { searchGccs } from "@/lib/repo/gccRepo";
import { fail, ok } from "@/lib/http";

// GET /api/v1/gccs?q=&city=&sector=&provider=&verification=&status=&page=&pageSize=
export function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const page = Number(p.get("page") ?? 1);
  const pageSize = Number(p.get("pageSize") ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return fail(400, "BAD_PAGINATION", "page must be 1 or more and pageSize between 1 and 100.");
  }
  const { items, total } = searchGccs({
    q: p.get("q") ?? undefined,
    city: p.get("city") ?? undefined,
    sector: p.get("sector") ?? undefined,
    provider: p.get("provider") ?? undefined,
    verification: p.get("verification") ?? undefined,
    status: p.get("status") ?? undefined,
    page,
    pageSize,
  });
  return ok(items, { cacheSeconds: 60, meta: { total, page, pageSize, pages: Math.ceil(total / pageSize) } });
}
