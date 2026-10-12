import { NextResponse } from "next/server";

// One response envelope for the whole API: { data } on success, { error: { code, message } } on failure.
export function ok<T>(data: T, opts: { cacheSeconds?: number; status?: number; meta?: Record<string, unknown> } = {}) {
  const headers: Record<string, string> = {};
  headers["Cache-Control"] = opts.cacheSeconds ? `public, s-maxage=${opts.cacheSeconds}, stale-while-revalidate=${opts.cacheSeconds * 10}` : "no-store";
  return NextResponse.json(opts.meta ? { data, meta: opts.meta } : { data }, { status: opts.status ?? 200, headers });
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Small fixed-window limiter for the AI and write endpoints. Per server instance; a shared store replaces it at scale.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimited(req: Request, bucket: string, limit = 10, windowMs = 60_000): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
