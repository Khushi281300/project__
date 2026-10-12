// Pure domain calculations for GCC Setup Feasibility, Budget Estimation, and Location Optimization.
// Dependency-free so it can be unit-tested and run both client-side and server-side.

export type OperatingModel = "captive" | "bot" | "eor";

export interface SimulatorInput {
  companyName?: string;
  sector: string; // e.g. "FinTech", "Retail", "Enterprise SaaS", "Healthcare", "Automotive"
  headcount: number;
  city: string; // city name or "auto"
  operatingModel: OperatingModel;
  functionMix?: {
    engineering?: number; // %
    aiData?: number; // %
    cloudSecOps?: number; // %
    operations?: number; // %
  };
}

export interface SimulatorCostBreakdown {
  talentAnnualInr: number; // in INR Crores
  talentAnnualUsd: number; // in USD
  realEstateAnnualInr: number;
  realEstateAnnualUsd: number;
  operationalCapexInr: number;
  operationalCapexUsd: number;
  stateIncentiveSavingsInr: number;
  stateIncentiveSavingsUsd: number;
  totalAnnualRunRateInr: number;
  totalAnnualRunRateUsd: number;
  usEquivalentUsd: number;
  netSavingsUsd: number;
  savingsPercentage: number;
}

export interface CityMatch {
  city: string;
  tier: "Tier 1" | "Tier 2";
  score: number;
  avgRent: number; // INR / sqft / mo
  talentFactor: number;
  reasons: string[];
}

export interface SimulatorResult {
  selectedCity: string;
  isAutoRecommended: boolean;
  headcount: number;
  operatingModel: OperatingModel;
  cost: SimulatorCostBreakdown;
  cityRankings: CityMatch[];
  operatingModelDetails: {
    title: string;
    timeToFirstHire: string;
    upfrontCapexSummary: string;
    governanceProfile: string;
    suitability: string;
  };
  policyHighlights: string[];
  roadmapPhases: Array<{ phase: string; window: string; deliverable: string }>;
}

const CITY_FACTORS: Record<string, { tier: "Tier 1" | "Tier 2"; rent: number; talent: number; primarySectors: string[]; incentives: string[] }> = {
  Bengaluru: {
    tier: "Tier 1",
    rent: 95,
    talent: 1.0,
    primarySectors: ["Enterprise SaaS", "AI & DeepTech", "FinTech", "Retail Tech"],
    incentives: ["Karnataka GCC Policy: Up to 50% lease rental subsidy in Beyond-Bengaluru clusters", "100% stamp duty reimbursement"],
  },
  Hyderabad: {
    tier: "Tier 1",
    rent: 74,
    talent: 0.90,
    primarySectors: ["Life Sciences & Pharma", "Cloud & Cybersecurity", "FinTech", "Aerospace"],
    incentives: ["100% stamp duty exemption on IT premises", "₹2/unit power tariff subsidy for 3 years", "Single-window 15-day clearance"],
  },
  Pune: {
    tier: "Tier 1",
    rent: 70,
    talent: 0.84,
    primarySectors: ["Automotive Tech & EV", "Industrial IoT", "FinTech", "HealthTech"],
    incentives: ["Maharashtra GCC Policy 2025: Capital subsidy up to 30%", "Electricity duty waiver for 7 years"],
  },
  Chennai: {
    tier: "Tier 1",
    rent: 68,
    talent: 0.81,
    primarySectors: ["Automotive & Auto-Tech", "Healthcare & MedTech", "SaaS & CRM", "BFSI Operations"],
    incentives: ["Tamil Nadu GCC Special Scheme: Up to 30% payroll subsidy for Fortune 1000 entrants (200+ jobs)", "Plug-and-play ELCOT SEZ facilities"],
  },
  "Delhi NCR": {
    tier: "Tier 1",
    rent: 82,
    talent: 0.93,
    primarySectors: ["Consulting & Analytics", "Consumer Tech & Media", "Telecom", "Shared Services"],
    incentives: ["Haryana & UP IT promotion subsidies", "Net SGST refunds for up to 7 years in select hubs"],
  },
  Coimbatore: {
    tier: "Tier 2",
    rent: 45,
    talent: 0.67,
    primarySectors: ["Embedded Systems", "Industrial Automation", "FinTech Operations", "Healthcare"],
    incentives: ["Tamil Nadu Tier-2 bonus: Enhanced capex subsidies and special ELCOT park rental rebates"],
  },
  "Ahmedabad / GIFT City": {
    tier: "Tier 2",
    rent: 52,
    talent: 0.72,
    primarySectors: ["International Banking & Finance", "FinTech", "Treasury & Global Markets"],
    incentives: ["10-year corporate tax holiday in GIFT IFSC", "Zero GST on offshore export services", "Capex assistance up to ₹50 Cr"],
  },
};

const USD_TO_INR = 83.5;

export function calculateSimulation(input: SimulatorInput): SimulatorResult {
  const headcount = Math.max(Math.min(input.headcount || 100, 1000), 10);
  const mix = {
    engineering: input.functionMix?.engineering ?? 55,
    aiData: input.functionMix?.aiData ?? 20,
    cloudSecOps: input.functionMix?.cloudSecOps ?? 15,
    operations: input.functionMix?.operations ?? 10,
  };
  const totalMix = (mix.engineering + mix.aiData + mix.cloudSecOps + mix.operations) || 100;
  const weights = {
    eng: mix.engineering / totalMix,
    ai: mix.aiData / totalMix,
    cloud: mix.cloudSecOps / totalMix,
    ops: mix.operations / totalMix,
  };

  // Base salary benchmark per function (INR annual base in Bengaluru):
  // Weighted seniority mix (10% Lead @ ₹78L, 25% Senior @ ₹44L, 45% Mid @ ₹24L, 20% Jr @ ₹12L) = ~₹28.4L base
  const baseEng = 28.5; // Lakhs
  const baseAi = 34.0; // Lakhs (AI/ML premium)
  const baseCloud = 27.0; // Lakhs
  const baseOps = 16.0; // Lakhs
  const blendedBaseBengaluruLakhs = (weights.eng * baseEng) + (weights.ai * baseAi) + (weights.cloud * baseCloud) + (weights.ops * baseOps);

  // Score cities for best fit
  const cityEntries = Object.entries(CITY_FACTORS);
  const scoredCities: CityMatch[] = cityEntries.map(([city, data]) => {
    let score = 70;
    const reasons: string[] = [];

    // Sector match
    const sectorMatch = data.primarySectors.some((s) => s.toLowerCase().includes((input.sector || "").toLowerCase()) || (input.sector || "").toLowerCase().includes(s.toLowerCase()));
    if (sectorMatch) {
      score += 18;
      reasons.push(`High density of ${input.sector || "domain"} talent & peer GCCs`);
    }

    // Headcount scaling match
    if (headcount >= 250 && data.tier === "Tier 1") {
      score += 10;
      reasons.push("Large-scale talent pipeline capable of absorbing 250+ technical hires");
    } else if (headcount < 100 && data.tier === "Tier 2") {
      score += 12;
      reasons.push("Ideal for agile 25-100 person specialized hub with >30% cost savings");
    }

    // Cost efficiency
    if (data.talent < 0.85) {
      score += 6;
      reasons.push(`Favorable talent cost arbitrage (${Math.round((1 - data.talent) * 100)}% lower than Bengaluru)`);
    }

    if (city === "Bengaluru") reasons.push("Asia's deepest tech talent hub, premier leadership availability");
    if (city === "Hyderabad") reasons.push("Fastest-growing GCC hub with proactive single-window government support");
    if (city === "Pune") reasons.push("Strong confluence of software, automotive engineering and top universities");
    if (city === "Ahmedabad / GIFT City" && (input.sector.toLowerCase().includes("fin") || input.sector.toLowerCase().includes("bank"))) {
      score += 15;
      reasons.push("GIFT IFSC provides 10-year 100% tax exemption and foreign currency freedom");
    }

    return {
      city,
      tier: data.tier,
      score: Math.min(score, 98),
      avgRent: data.rent,
      talentFactor: data.talent,
      reasons: reasons.slice(0, 3),
    };
  }).sort((a, b) => b.score - a.score);

  const isAuto = !input.city || input.city === "auto" || !CITY_FACTORS[input.city];
  const chosenCityName = isAuto ? scoredCities[0].city : input.city;
  const chosenCityData = CITY_FACTORS[chosenCityName] || CITY_FACTORS["Bengaluru"];

  // Annual talent cost calculation
  // Base salary * city factor * employer overhead multiplier (PF, Gratuity, Health Insurance, Admin = 1.18x)
  const salaryPerHeadLakhs = blendedBaseBengaluruLakhs * chosenCityData.talent;
  const loadedSalaryPerHeadInr = salaryPerHeadLakhs * 100_000 * 1.18;
  const totalTalentCostInr = loadedSalaryPerHeadInr * headcount;
  const totalTalentCostUsd = totalTalentCostInr / USD_TO_INR;

  // Real estate calculation
  // 110 sq ft per head * monthly rent * 12 months + maintenance/utilities (~₹18/sqft/mo)
  const sqFtPerHead = 110;
  const totalSqFt = headcount * sqFtPerHead;
  const monthlyRentAndOpexPerSqFt = chosenCityData.rent + 18;
  const annualRealEstateInr = totalSqFt * monthlyRentAndOpexPerSqFt * 12;
  const annualRealEstateUsd = annualRealEstateInr / USD_TO_INR;

  // One-time Setup / Legal / Capex vs Amortized Annual
  let capexInr = 0;
  if (input.operatingModel === "captive") {
    // Incorporation, transfer pricing study, IT hardware, initial fitout deposit
    capexInr = (totalSqFt * 1800) + (headcount * 150_000) + 4_000_000;
  } else if (input.operatingModel === "bot") {
    // Managed partner handles capex; lower upfront client capex amortized into management fee
    capexInr = (headcount * 120_000) + 2_000_000;
  } else {
    // EOR model: zero facility capex, hardware leasing only
    capexInr = headcount * 90_000;
  }
  const capexUsd = capexInr / USD_TO_INR;

  // Operating model modifier on annual run rate
  let modelFeeInr = 0;
  if (input.operatingModel === "bot") {
    // BOT partner typical management fee is ~14% on payroll & facility opex
    modelFeeInr = (totalTalentCostInr + annualRealEstateInr) * 0.14;
  } else if (input.operatingModel === "eor") {
    // EOR platform management fee (e.g. Flexiple / EOR platform ~$500/head/month)
    modelFeeInr = headcount * 500 * 12 * USD_TO_INR;
  }

  // State incentives estimation
  let incentiveInr = 0;
  if (chosenCityName === "Bengaluru") {
    incentiveInr = Math.min(annualRealEstateInr * 0.08, 1_500_000);
  } else if (chosenCityName === "Hyderabad") {
    incentiveInr = (headcount * 20_000) + 1_200_000;
  } else if (chosenCityName === "Chennai" || chosenCityName === "Coimbatore") {
    incentiveInr = headcount >= 100 ? totalTalentCostInr * 0.05 : 1_000_000;
  } else if (chosenCityName === "Pune") {
    incentiveInr = capexInr * 0.10;
  } else if (chosenCityName.includes("GIFT")) {
    incentiveInr = (totalTalentCostInr * 0.12) + 2_500_000;
  }
  const incentiveUsd = incentiveInr / USD_TO_INR;

  const totalRunRateInr = totalTalentCostInr + annualRealEstateInr + modelFeeInr - incentiveInr;
  const totalRunRateUsd = totalRunRateInr / USD_TO_INR;

  // US Equivalent benchmark:
  // Avg loaded tech employee cost in US: ~$185k/yr + $14,000/yr facility & IT overhead = ~$199k per seat
  const usCostPerHeadUsd = 195_000;
  const usEquivalentUsd = headcount * usCostPerHeadUsd;
  const netSavingsUsd = Math.max(usEquivalentUsd - totalRunRateUsd, 0);
  const savingsPct = Math.round((netSavingsUsd / usEquivalentUsd) * 100);

  const modelMetadata: Record<OperatingModel, SimulatorResult["operatingModelDetails"]> = {
    captive: {
      title: "Direct Wholly Owned Captive",
      timeToFirstHire: "4 to 6 months",
      upfrontCapexSummary: "High (Entity registration, STPI/SEZ licensing, leasehold security deposits)",
      governanceProfile: "100% IP & cultural control from day one; high ongoing compliance overhead",
      suitability: "Recommended for teams planning >150 engineers who require strict in-house corporate legal presence",
    },
    bot: {
      title: "Build-Operate-Transfer (BOT)",
      timeToFirstHire: "2 to 3 months",
      upfrontCapexSummary: "Moderate (Partner finances fit-out; cost converted into ongoing opex fee)",
      governanceProfile: "Turnkey partner manages HR, payroll, real estate; transfers legal ownership after 24-36 months",
      suitability: "Best for mid-sized enterprises wanting speed and zero local compliance risk before full entity transfer",
    },
    eor: {
      title: "Employer of Record (EOR) / Flexible Talent Hub",
      timeToFirstHire: "2 to 4 weeks",
      upfrontCapexSummary: "Near Zero (No local legal entity needed, pay-per-seat monthly SaaS/EOR fee)",
      governanceProfile: "Engineers operate as dedicated team members; statutory payroll handled by licensed local partner",
      suitability: "Ideal for fast pilot teams (15-75 engineers), specialized AI pods, or pre-incorporation speed",
    },
  };

  return {
    selectedCity: chosenCityName,
    isAutoRecommended: isAuto,
    headcount,
    operatingModel: input.operatingModel,
    cost: {
      talentAnnualInr: totalTalentCostInr / 10_000_000, // Crores
      talentAnnualUsd: totalTalentCostUsd,
      realEstateAnnualInr: annualRealEstateInr / 10_000_000, // Crores
      realEstateAnnualUsd: annualRealEstateUsd,
      operationalCapexInr: capexInr / 10_000_000, // Crores
      operationalCapexUsd: capexUsd,
      stateIncentiveSavingsInr: incentiveInr / 10_000_000, // Crores
      stateIncentiveSavingsUsd: incentiveUsd,
      totalAnnualRunRateInr: totalRunRateInr / 10_000_000, // Crores
      totalAnnualRunRateUsd: totalRunRateUsd,
      usEquivalentUsd,
      netSavingsUsd,
      savingsPercentage: savingsPct,
    },
    cityRankings: scoredCities,
    operatingModelDetails: modelMetadata[input.operatingModel],
    policyHighlights: chosenCityData.incentives,
    roadmapPhases: [
      { phase: "Phase 1: Foundation & Entity / Partner Setup", window: "Months 0-2", deliverable: "Entity incorporation (or EOR onboarding), banking setup, STPI registration, and anchor leadership talent search." },
      { phase: "Phase 2: Core Engineering & Infrastructure", window: "Months 2-5", deliverable: "Workplace fitout/flex space activation, onboarding core pods (Lead + Senior SDEs), establishing secure CI/CD network conduits." },
      { phase: "Phase 3: Production & Value Escalation", window: "Months 5-12", deliverable: "Transition from staff augmentation to autonomous product ownership, local innovation sprints, scaling to target headcount." },
    ],
  };
}
