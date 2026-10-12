import { getGcc } from "@/lib/repo/gccRepo";
import { fail, ok } from "@/lib/http";

// GET /api/v1/gccs/:slug — one record with every source and provider link.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const gcc = getGcc(slug);
  return gcc ? ok(gcc, { cacheSeconds: 60 }) : fail(404, "NOT_FOUND", "No GCC record with that id.");
}
