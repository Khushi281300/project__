import { calculateSimulation, type SimulatorInput, type SimulatorResult } from "@/lib/domain/simulator";
import { searchGccs } from "@/lib/repo/gccRepo";
import { listProviders } from "@/lib/repo/providerRepo";
import { aiConfigured, complete } from "@/lib/llm/anthropic";

export interface BlueprintPlan {
  mode: "ai" | "rules";
  simulation: SimulatorResult;
  peerGccs: Array<{ slug: string; company: string; city: string; sector: string; verification: string; providers: string }>;
  recommendedProviders: Array<{ slug: string; name: string; type: string; verifiedLinks: number; claimedLinks: number }>;
  synthesis: string;
}

const SYSTEM = `You are a strategic GCC (Global Capability Centre) Expansion Director advising a multinational enterprise on setting up an engineering & operations centre in India.
You provide clear, concise, evidence-based recommendations using ONLY the supplied simulation figures and verified ledger facts.
Rules:
- Plain executive prose. Maximum 220 words.
- Structure your response into: 1. Strategic Rationale & Location Fit, 2. Talent & Hiring Blueprint, 3. Governance & Risk Mitigation.
- Explicitly cite peer GCCs from the ledger in square brackets, e.g. [ferguson-bengaluru].
- Do not invent providers or regulations not in the prompt.`;

export async function generateBlueprint(input: SimulatorInput): Promise<BlueprintPlan> {
  const sim = calculateSimulation(input);

  // Retrieve matching peer GCCs from the ledger for this sector or city
  const searchResult = searchGccs({
    sector: input.sector && input.sector !== "Other" ? input.sector : undefined,
    city: sim.selectedCity,
    pageSize: 4,
  });

  // If none matched both, search by city alone or sector alone
  let peers = searchResult.items;
  if (peers.length === 0) {
    peers = searchGccs({ city: sim.selectedCity, pageSize: 4 }).items;
  }
  if (peers.length === 0) {
    peers = searchGccs({ pageSize: 4 }).items;
  }

  const peerSummary = peers.map((p) => ({
    slug: p.slug,
    company: p.company,
    city: p.city,
    sector: p.sector,
    verification: p.verification,
    providers: p.providers || "None on record",
  }));

  // Match top providers based on operating model
  const allProviders = listProviders();
  const matchedProviders = allProviders.filter((p) => {
    if (input.operatingModel === "bot") return p.type.toLowerCase().includes("consult") || p.type.toLowerCase().includes("turnkey") || p.slug === "ansr" || p.slug === "anb-solutions";
    if (input.operatingModel === "eor") return p.type.toLowerCase().includes("talent") || p.name.toLowerCase().includes("flexiple") || p.type.toLowerCase().includes("staff");
    return p.verifiedLinks > 0;
  }).slice(0, 3);

  const fallbackProviders = matchedProviders.length ? matchedProviders : allProviders.slice(0, 3);

  // Rule-based synthesis (always available)
  const ruleSynthesis = [
    `### Strategic Location & Cost Profile`,
    `Setting up in **${sim.selectedCity}** provides an estimated annual run-rate of **$${(sim.cost.totalAnnualRunRateUsd / 1_000_000).toFixed(2)}M** for ${sim.headcount} specialists, delivering **$${(sim.cost.netSavingsUsd / 1_000_000).toFixed(2)}M in annual operational savings (${sim.cost.savingsPercentage}% arbitrage vs US equivalent)**.`,
    `Local peer benchmarks in the ledger include ${peerSummary.slice(0, 2).map((p) => `[${p.slug}] (${p.company}, ${p.city})`).join(" and ")}.`,
    ``,
    `### Operating Model & Delivery Roadmap`,
    `Under the **${sim.operatingModelDetails.title}** model, expect a timeline of **${sim.operatingModelDetails.timeToFirstHire}** to first cohort onboarding.`,
    sim.operatingModel === "eor"
      ? `The flexible talent/EOR model eliminates statutory entity delays and capital expenditure, enabling immediate talent acquisition via curated platforms before long-term captive incorporation.`
      : sim.operatingModel === "bot"
      ? `A Turnkey BOT partner will absorb local real estate fitout and regulatory compliance overhead, transitioning to complete corporate ownership after operational stabilization.`
      : `The wholly owned captive ensures total intellectual property insulation and corporate culture continuity, though requiring dedicated MCA incorporation and STPI/SEZ filings.`,
    ``,
    `### Key Governance & Policy Considerations`,
    `${sim.policyHighlights.join("; ")}.`,
  ].join("\n");

  if (!aiConfigured()) {
    return {
      mode: "rules",
      simulation: sim,
      peerGccs: peerSummary,
      recommendedProviders: fallbackProviders,
      synthesis: ruleSynthesis,
    };
  }

  const promptUser = [
    `Multinational: ${input.companyName || "Global Tech Enterprise"}`,
    `Sector: ${input.sector || "Enterprise Technology"}`,
    `Headcount: ${sim.headcount}`,
    `Selected City: ${sim.selectedCity} (${sim.cityRankings[0]?.tier})`,
    `Operating Model: ${sim.operatingModelDetails.title} (${sim.operatingModel})`,
    `Cost Projections: India Run-rate $${(sim.cost.totalAnnualRunRateUsd / 1_000_000).toFixed(2)}M vs US $${(sim.cost.usEquivalentUsd / 1_000_000).toFixed(2)}M (Savings: ${sim.cost.savingsPercentage}%)`,
    `Applicable State Incentives: ${sim.policyHighlights.join(", ")}`,
    `Peer GCC records in ledger: ${peerSummary.map((p) => `[${p.slug}] ${p.company} in ${p.city} (${p.verification})`).join("; ")}`,
    `Vetted Providers in ledger: ${fallbackProviders.map((p) => `${p.name} (${p.verifiedLinks} verified)`).join(", ")}`,
  ].join("\n\n");

  try {
    const aiAnswer = await complete({ system: SYSTEM, user: promptUser, maxTokens: 450 });
    return {
      mode: "ai",
      simulation: sim,
      peerGccs: peerSummary,
      recommendedProviders: fallbackProviders,
      synthesis: aiAnswer,
    };
  } catch {
    return {
      mode: "rules",
      simulation: sim,
      peerGccs: peerSummary,
      recommendedProviders: fallbackProviders,
      synthesis: ruleSynthesis,
    };
  }
}
