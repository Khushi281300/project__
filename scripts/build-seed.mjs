// Turns the two raw research files into one curated seed file.
// Curation decisions (drops, caveats, which source backs which link) live here so they are reviewable.
import { readFileSync, writeFileSync } from "node:fs";

const raw = (f) => JSON.parse(readFileSync(new URL(`../data/raw/${f}`, import.meta.url), "utf8"));
const G = raw("research_gccs.json").gccs;
const E = raw("research_engagements.json").engagements;

const STATE = { Bengaluru: "Karnataka", Hyderabad: "Telangana", Gurugram: "Haryana", Pune: "Maharashtra" };
const SECTOR = {
  Ferguson: "Other", "Marriott International": "Other", "Deutsche Börse Group": "BFSI", Inovalon: "Healthcare and Pharma",
  "Nestlé": "Retail and Consumer", "Western Union": "BFSI", "GI Outsourcing": "Other", "Truist Financial": "BFSI",
  "Lufthansa Group": "Logistics", Polestar: "Manufacturing and Automotive", "Citizens Financial Group": "BFSI",
  Goodyear: "Manufacturing and Automotive", Storable: "Technology", Daikin: "Manufacturing and Automotive", StarRez: "Technology",
};
// Dropped: not a GCC set-up (takeover of an existing centre, a vendor delivery centre, or no city stated).
const DROP = new Set(["Best Buy", "Eurobank", "Dai-ichi Life Group"]);
const ANNOUNCED = new Set(["Nestlé", "Marriott International", "Truist Financial", "Lufthansa Group", "Goodyear", "Daikin"]);
const CAVEAT = {
  Polestar: "Sources call this a technology hub, not a GCC.",
  Inovalon: "The source calls this an India Development Center, not a GCC.",
  StarRez: "The source calls this an innovation hub. Headquarters country is not stated in the source.",
  Goodyear: "Reported by two outlets; no company confirmation found.",
  eBay: "eBay has had a Bengaluru development centre for years; 'first India GCC' is the source's wording.",
  Toast: "The source calls this a global technology center, not a GCC.",
  "JPMorgan Chase": "Centres span Mumbai, Bengaluru and Hyderabad; headcount and start year are India-wide.",
  "Wells Fargo": "Also operates in Bengaluru. Sources disagree on headcount (10,000 to over 30,000).",
  "Marriott International": "Planned to be fully operational in early 2025; no page confirming the opening was found.",
  "Nestlé": "2026 is the planned date.",
  Carlsberg: "The 300-plus headcount spans Gurugram and Hyderabad.",
  "Stolt-Nielsen": "Opening year and headquarters country are not stated in the sources.",
  "NTT DATA Business Solutions": "Headquarters country is not stated in the source.",
};
// For GCC records that name a partner: which of the GCC's sources actually name that partner.
const PARTNER = {
  Carlsberg: { role: "build-operate", type: "IT services firm", publishers: null },
  "Abercrombie & Fitch": { role: "setup", type: "GCC setup partner", publishers: null },
  CIBC: { role: "setup", type: "GCC setup partner", publishers: ["Outsource Accelerator"] },
  "NTT DATA Business Solutions": { role: "setup", type: "IT services firm", publishers: null },
  Target: { role: "setup", type: "GCC setup partner", publishers: ["ANSR"] },
};
const ROLE = { "build-operate-transfer": "build-operate" };

const gccs = new Map();
const key = (company, city) => `${company}|${city}`;
const engagements = [];

for (const g of G) {
  gccs.set(key(g.company, g.gcc_city), {
    company: g.company, hq: g.company_hq_country || "", sector: g.company_sector, city: g.gcc_city, state: g.gcc_state || STATE[g.gcc_city] || "",
    status: g.status, opened: g.opened || "", focus: g.focus || "", headcount: g.headcount_note || "", office: g.office_note || "",
    caveat: CAVEAT[g.company] || "", sources: g.sources,
  });
  if (g.setup_partner) {
    const p = PARTNER[g.company];
    engagements.push({
      company: g.company, city: g.gcc_city, provider: g.setup_partner, providerType: p.type, role: p.role,
      sources: g.sources.filter((s) => !p.publishers || p.publishers.includes(s.publisher)),
    });
  }
}

for (const e of E) {
  if (DROP.has(e.company)) continue;
  const k = key(e.company, e.gcc_city);
  if (gccs.has(k)) {
    // A source about a provider link also evidences the centre itself: merge, one row per URL.
    const g = gccs.get(k);
    const seen = new Set(g.sources.map((x) => x.url));
    g.sources = [...g.sources, ...e.sources.filter((x) => !seen.has(x.url))];
  } else {
    gccs.set(k, {
      company: e.company, hq: e.company_hq_country || "", sector: SECTOR[e.company] || "Other", city: e.gcc_city, state: STATE[e.gcc_city] || "",
      status: ANNOUNCED.has(e.company) || !e.gcc_opened ? "announced" : "operational", opened: e.gcc_opened || "", focus: "", headcount: "", office: "",
      caveat: CAVEAT[e.company] || "", sources: e.sources,
    });
  }
  engagements.push({
    company: e.company, city: e.gcc_city, provider: e.provider, providerType: e.provider_type,
    role: e.company === "Daikin" ? "advisory" : ROLE[e.role] || e.role, sources: e.sources,
  });
}

const out = { generatedAt: "2026-10-11", gccs: [...gccs.values()], engagements };
writeFileSync(new URL("../data/seed.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(`seed: ${out.gccs.length} GCCs, ${out.engagements.length} provider links`);
