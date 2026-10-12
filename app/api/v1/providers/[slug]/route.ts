import { getProvider } from "@/lib/repo/providerRepo";
import { fail, ok } from "@/lib/http";

// GET /api/v1/providers/:slug — one provider's track record with sources.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const provider = getProvider(slug);
  return provider ? ok(provider, { cacheSeconds: 60 }) : fail(404, "NOT_FOUND", "No provider with that id.");
}
