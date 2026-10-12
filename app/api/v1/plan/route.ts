import { generateBlueprint } from "@/lib/services/planGenerator";
import { type OperatingModel, type SimulatorInput } from "@/lib/domain/simulator";
import { fail, ok, rateLimited, readJson } from "@/lib/http";

export async function POST(req: Request) {
  if (rateLimited(req, "plan", 15, 60_000)) {
    return fail(429, "RATE_LIMITED", "Too many blueprint requests. Please wait a moment.");
  }

  const body = await readJson(req);
  if (!body) return fail(400, "BAD_REQUEST", "Invalid JSON payload.");

  const sector = typeof body.sector === "string" ? body.sector.trim().slice(0, 80) : "Enterprise Tech";
  const city = typeof body.city === "string" ? body.city.trim().slice(0, 80) : "auto";
  const headcount = typeof body.headcount === "number" ? Math.max(10, Math.min(1000, body.headcount)) : 100;
  const companyName = typeof body.companyName === "string" ? body.companyName.trim().slice(0, 100) : "";
  const modelRaw = typeof body.operatingModel === "string" ? body.operatingModel.toLowerCase() : "captive";
  const operatingModel: OperatingModel = modelRaw === "bot" || modelRaw === "eor" ? modelRaw : "captive";

  const functionMix = typeof body.functionMix === "object" && body.functionMix !== null ? body.functionMix as SimulatorInput["functionMix"] : undefined;

  const input: SimulatorInput = {
    companyName,
    sector,
    city,
    headcount,
    operatingModel,
    functionMix,
  };

  try {
    const blueprint = await generateBlueprint(input);
    return ok(blueprint);
  } catch (err) {
    return fail(500, "PLAN_GENERATION_FAILED", err instanceof Error ? err.message : "Failed to generate plan");
  }
}
