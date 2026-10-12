// Published market figures, each with the page it was read on. Kept as code (not seed data) because it is
// reference material that is displayed, not records that are searched. Read October 2026.
// Where publishers disagree, both figures are kept: the disagreement is the point of the page.

export interface CountClaim {
  who: string;
  value: number;
  unit: string; // what is being counted
  note: string;
  url: string;
  kind: "published" | "vendor" | "ours";
}

export const COUNTS: CountClaim[] = [
  { who: "Nasscom and Zinnov, FY26", value: 2117, unit: "GCCs", note: "Across 3,728 centres (units). The FY24 edition said 1,700+ GCCs and 2,975 units.", url: "https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-2026-report/", kind: "published" },
  { who: "Inductus GCC Compendium, 2024", value: 1800, unit: "GCCs (\"over\")", note: "Quoted in Dataquest, February 2025.", url: "https://happiestminds.com/wp-content/uploads/2025/02/Dataquest-Print-Edition.pdf", kind: "published" },
  { who: "Vestian Research", value: 1700, unit: "GCCs (\"nearly\")", note: "Says the count passes 2,100 by FY28.", url: "https://therealtytoday.com/news/india-leads-global-gcc-expansion-projected-to-cross-2100-centers-by-fy28-amid-tier-2-city-surge-vestian-report", kind: "published" },
  { who: "A sales-data vendor (Oceanfrogs GCC Intel)", value: 2800, unit: "companies", note: "Every company with a foreign HQ and people in India. It sells only 1,400 of them as established GCCs.", url: "https://oceanfrogs.com/intel/gcc/", kind: "vendor" },
  { who: "Flexiple directory, Aug 2026", value: 536, unit: "verified GCCs", note: "Described by Flexiple as a verified set, not a census.", url: "https://flexiple.com/gcc/india", kind: "published" },
  { who: "This ledger", value: 50, unit: "sourced records", note: "A hand-checked sample with a source on every row.", url: "/", kind: "ours" },
];

export interface CityClaim { city: string; vestian: number | null; other: string; otherUrl: string }

export const CITIES: CityClaim[] = [
  { city: "Bengaluru", vestian: 487, other: "JLL: over 900 GCC units, 34 to 39% of the market (Feb 2026)", otherUrl: "https://www.jll.com/en-in/newsroom/india-s-gcc-expansion-hits-record-31-million" },
  { city: "Hyderabad", vestian: 273, other: "Telangana outlook: about 20% of India's GCCs; 40 new in 2025, the most of any city", otherUrl: "https://www.deccanchronicle.com/southern-states/telangana/hyderabad-emerges-as-gcc-hub-hosts-20-of-indias-gccs-1945301" },
  { city: "Mumbai", vestian: 207, other: "BFSI & FinTech capital; ~12% of total national GCC footprint", otherUrl: "https://www.jll.com/en-in/newsroom/india-s-gcc-expansion-hits-record-31-million" },
  { city: "Pune", vestian: 178, other: "JLL: 15 to 20% of national GCC activity, 2022 to 2025", otherUrl: "https://www.jll.com/en-in/newsroom/india-s-gcc-expansion-hits-record-31-million" },
  { city: "Chennai", vestian: 162, other: "SaaS, Automotive & Healthcare hub; ~9% of national GCC footprint", otherUrl: "https://www.ey.com/en_in/insights/consulting/exploring-the-shift-gccs-moving-to-tier-2-cities-for-cost-and-talent-advantages" },
  { city: "Delhi NCR", vestian: 145, other: "Gurugram & Noida consulting, telecom & consumer tech corridor", otherUrl: "https://www.jll.com/en-in/newsroom/india-s-gcc-expansion-hits-record-31-million" },
];

export interface CityBenchmark {
  city: string;
  tier: "Tier 1" | "Tier 2";
  state: string;
  share: string;
  gradeARent: { min: number; max: number; avg: number }; // INR / sq ft / month
  talentCostMultiplier: number; // vs Bengaluru (1.0)
  medianSalary: {
    midEngineer: string;
    staffLead: string;
    director: string;
  };
  topSectors: string[];
  keyStrengths: string;
  incentiveHighlights: string;
}

export const CITY_BENCHMARKS: CityBenchmark[] = [
  {
    city: "Bengaluru",
    tier: "Tier 1",
    state: "Karnataka",
    share: "36-39% of India GCCs",
    gradeARent: { min: 80, max: 125, avg: 95 },
    talentCostMultiplier: 1.0,
    medianSalary: {
      midEngineer: "₹20 - ₹28L ($24-34k)",
      staffLead: "₹42 - ₹60L ($50-72k)",
      director: "₹75 - ₹1.1Cr ($90-132k)",
    },
    topSectors: ["Enterprise SaaS", "AI & DeepTech", "FinTech", "Retail Tech"],
    keyStrengths: "Deepest tech talent pool in Asia; 1.5M+ engineers; premier ecosystem for leadership & R&D.",
    incentiveHighlights: "Karnataka GCC Policy 2024: Up to 50% lease rental subsidy for first 2 years in Beyond-Bengaluru clusters; power tariff concessions.",
  },
  {
    city: "Hyderabad",
    tier: "Tier 1",
    state: "Telangana",
    share: "20-22% of India GCCs",
    gradeARent: { min: 62, max: 90, avg: 74 },
    talentCostMultiplier: 0.90,
    medianSalary: {
      midEngineer: "₹18 - ₹25L ($21-30k)",
      staffLead: "₹38 - ₹54L ($45-65k)",
      director: "₹68 - ₹95L ($81-114k)",
    },
    topSectors: ["Life Sciences & Pharma", "Cloud & Cybersecurity", "FinTech", "Aerospace"],
    keyStrengths: "HITEC City & Financial District infrastructure; state-backed single-window clearance; highest GCC growth rate (40+ new in 2025).",
    incentiveHighlights: "Telangana ICT Policy: 100% stamp duty exemption, ₹2/unit power subsidy for 3 years, recruitment subsidies per employee.",
  },
  {
    city: "Pune",
    tier: "Tier 1",
    state: "Maharashtra",
    share: "11-13% of India GCCs",
    gradeARent: { min: 60, max: 88, avg: 70 },
    talentCostMultiplier: 0.84,
    medianSalary: {
      midEngineer: "₹16 - ₹23L ($19-27k)",
      staffLead: "₹34 - ₹48L ($40-58k)",
      director: "₹62 - ₹85L ($74-102k)",
    },
    topSectors: ["Automotive Tech & EV", "Industrial IoT", "FinTech", "HealthTech"],
    keyStrengths: "Pinnacle engineering academic hub (COEP, Pune Univ); strong manufacturing legacy fused with modern software; proximity to Mumbai.",
    incentiveHighlights: "Maharashtra GCC Policy 2025: Capital subsidy up to 30%, electricity duty exemption for 7 years, stamp duty refunds.",
  },
  {
    city: "Chennai",
    tier: "Tier 1",
    state: "Tamil Nadu",
    share: "9-11% of India GCCs",
    gradeARent: { min: 58, max: 82, avg: 68 },
    talentCostMultiplier: 0.81,
    medianSalary: {
      midEngineer: "₹15 - ₹22L ($18-26k)",
      staffLead: "₹32 - ₹46L ($38-55k)",
      director: "₹60 - ₹82L ($72-98k)",
    },
    topSectors: ["Automotive & Auto-Tech", "Healthcare & MedTech", "SaaS & CRM", "BFSI Operations"],
    keyStrengths: "Low talent attrition (12-14% vs 20%+ in BLR); strong hardware-software confluence; premier engineering graduates (IIT Madras, Anna Univ).",
    incentiveHighlights: "Tamil Nadu GCC Special Scheme: Up to 30% payroll subsidy for 2 years for Fortune 1000 entrants committing 200+ direct jobs.",
  },
  {
    city: "Delhi NCR",
    tier: "Tier 1",
    state: "Haryana / UP / Delhi",
    share: "10-12% of India GCCs",
    gradeARent: { min: 65, max: 105, avg: 82 },
    talentCostMultiplier: 0.93,
    medianSalary: {
      midEngineer: "₹18 - ₹26L ($21-31k)",
      staffLead: "₹38 - ₹55L ($45-66k)",
      director: "₹70 - ₹98L ($84-118k)",
    },
    topSectors: ["Consulting & Analytics", "Consumer Tech & Media", "Telecom", "Shared Services"],
    keyStrengths: "Massive metropolitan footprint (Gurugram cyber corridor, Noida expressway); international diplomatic & corporate headquarters hub.",
    incentiveHighlights: "Haryana Enterprise & IT Promotion Policy: Employment generation subsidies, 100% net SGST reimbursement for up to 7 years.",
  },
  {
    city: "Coimbatore",
    tier: "Tier 2",
    state: "Tamil Nadu",
    share: "2-3% of India GCCs (Rising)",
    gradeARent: { min: 38, max: 55, avg: 45 },
    talentCostMultiplier: 0.67,
    medianSalary: {
      midEngineer: "₹12 - ₹17L ($14-20k)",
      staffLead: "₹24 - ₹35L ($28-42k)",
      director: "₹45 - ₹65L ($54-78k)",
    },
    topSectors: ["Embedded Systems", "Industrial Automation", "FinTech Operations", "Healthcare"],
    keyStrengths: "Exceptional cost arbitrage (35% lower cost of operations than Bengaluru); high retention; 30+ engineering institutions.",
    incentiveHighlights: "Tamil Nadu Tier-2 GCC incentive: Additional capital subsidy bonuses and customized infrastructure support in ELCOT IT parks.",
  },
  {
    city: "Ahmedabad / GIFT City",
    tier: "Tier 2",
    state: "Gujarat",
    share: "2-3% of India GCCs (Rising)",
    gradeARent: { min: 45, max: 65, avg: 52 },
    talentCostMultiplier: 0.72,
    medianSalary: {
      midEngineer: "₹13 - ₹18L ($15-21k)",
      staffLead: "₹26 - ₹38L ($31-45k)",
      director: "₹50 - ₹70L ($60-84k)",
    },
    topSectors: ["International Banking & Finance", "FinTech", "Treasury & Global Markets", "IT Services"],
    keyStrengths: "GIFT City Special Economic Zone (SEZ): Single-window IFSC regulator, 100% tax holiday for 10 out of 15 years, relaxed currency regulations.",
    incentiveHighlights: "Gujarat GCC Policy 2025: Capex subsidy up to ₹50 Crore, operational assistance up to ₹5 Crore/year for 5 years.",
  },
];

export interface Policy {
  state: string;
  name: string;
  aim: string;
  hook: string;
  url: string;
  capitalSubsidy: string;
  leaseSupport: string;
  taxTariff: string;
  minJobs: string;
}

export const POLICIES: Policy[] = [
  {
    state: "Karnataka",
    name: "GCC Policy 2024 to 2029",
    aim: "500 new centres, 350,000 jobs, $50 billion output",
    hook: "A \"Beyond Bengaluru\" incentive tier for centres outside the capital",
    url: "https://eitbt.karnataka.gov.in/it/public/policy5/en",
    capitalSubsidy: "Up to 25% of eligible capex (max ₹10 Cr) in Beyond Bengaluru clusters (Mysuru, Hubballi, Mangaluru)",
    leaseSupport: "50% lease rental subsidy up to ₹15 Lakhs/year for 2 years in Tier-2/3 cities",
    taxTariff: "100% reimbursement of stamp duty and electricity duty exemption for 5 years",
    minJobs: "50 direct jobs for Bengaluru, 25 direct jobs for Beyond Bengaluru locations",
  },
  {
    state: "Maharashtra",
    name: "GCC Policy 2025",
    aim: "About 400 new centres and 400,000 jobs by 2030; Rs 50,600 crore investment",
    hook: "Incentives to push centres to Pune, Nagpur, Nashik and Chhatrapati Sambhajinagar",
    url: "https://industry.maharashtra.gov.in/sites/default/files/2025-09/gcc-policy-paraesa-naota-english.pdf",
    capitalSubsidy: "Up to 30% capital investment subsidy based on cluster classification",
    leaseSupport: "Lease rental rebate up to ₹25/sq ft/month for 3 years in emerging zones",
    taxTariff: "100% electricity duty waiver for 7 years and full stamp duty refund",
    minJobs: "100 direct employees for Tier-1 (Pune/Mumbai), 50 for Tier-2 hubs",
  },
  {
    state: "Tamil Nadu",
    name: "Special scheme, 2024-25 budget",
    aim: "50 GCCs; payroll subsidy to March 2027",
    hook: "Only Forbes Global 2000 or Fortune 1000 parents committing 200 or more direct jobs",
    url: "https://www.ey.com/en_in/insights/consulting/exploring-the-shift-gccs-moving-to-tier-2-cities-for-cost-and-talent-advantages",
    capitalSubsidy: "Structured customized package for Mega GCCs with capex > ₹100 Crore",
    leaseSupport: "Plug-and-play subsidized workspace in ELCOT IT SEZs across Chennai, Coimbatore, and Madurai",
    taxTariff: "Up to 30% payroll reimbursement per qualified employee for first 24 months",
    minJobs: "200 direct jobs with Forbes Global 2000 or Fortune 1000 corporate backing",
  },
  {
    state: "Telangana",
    name: "ICT Policy & GCC Facilitation Framework",
    aim: "Solidify Hyderabad as national GCC capital; 40+ new centres annually",
    hook: "Dedicated single-window GCC facilitation cell with 15-day statutory clearance SLA",
    url: "https://it.telangana.gov.in/",
    capitalSubsidy: "Assistance on high-end lab infrastructure, AI/ML computing clusters, and patents",
    leaseSupport: "25% lease rental assistance for startups and early GCC incubators",
    taxTariff: "100% stamp duty exemption on transfer of land/office and ₹2/unit power tariff concession for 3 years",
    minJobs: "50 direct technical employees within 18 months of commercial launch",
  },
  {
    state: "Gujarat (GIFT City IFSC)",
    name: "GCC Policy 2025 to 2030 & IFSC Framework",
    aim: "At least 250 new units, 50,000 jobs, Rs 10,000 crore investment",
    hook: "Global banking, finance & corporate treasury offshore status with dollar denomination",
    url: "https://dst.gujarat.gov.in/Home/GujaratGlobalCapabilityCenter",
    capitalSubsidy: "Up to 20% capex subsidy (ceiling ₹50 Cr) on server, hardware and networking setup",
    leaseSupport: "Annual operational assistance up to ₹5 Crore/year for 5 years",
    taxTariff: "100% corporate tax exemption for 10 out of 15 years in IFSC; zero GST on offshore services",
    minJobs: "50 employees in tech/analytics; 25 employees for specialized financial services",
  },
];

export const REAL_ESTATE = [
  { figure: "31 million sq ft", what: "Office space leased by GCCs in India in 2025, per JLL. Colliers puts the same year nearer 28 million.", url: "https://www.jll.com/en-in/newsroom/india-s-gcc-expansion-hits-record-31-million" },
  { figure: "Nearly 40%", what: "Share of all India office leasing that was GCC demand in 2025, per Colliers.", url: "https://www.colliers.com/en-in/news/press-release-gccs-in-india" },
  { figure: "350 million sq ft", what: "Forecast total GCC office footprint within three to four years, per JLL.", url: "https://www.jll.com/en-in/newsroom/india-s-gcc-expansion-hits-record-31-million" },
];
