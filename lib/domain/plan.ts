// Turns a plain-English question into ledger filters, and writes a cited answer from the matching records.
// Pure and dependency-free so it can be unit tested. It is what answers Ask when no AI key is set, and it also
// decides which records an AI answer is allowed to draw on.

export interface Vocab {
  cities: string[];
  sectors: string[];
  providers: Array<{ name: string; slug: string }>;
  companies: string[];
}

export interface Plan {
  cities: string[];
  notCities: string[];
  sector: string;
  providers: string[]; // slugs
  companies: string[]; // exact company names
  verification: "" | "verified" | "claimed"; // filters the centre record
  linkVerification: "" | "verified" | "claimed"; // filters provider links ("which providers have a verified set-up")
  status: "" | "operational" | "announced";
  wantsProviders: boolean;
  recognised: boolean;
  label: string; // human description of the filters, e.g. "verified records in Hyderabad"
}

export interface PlanRecord {
  slug: string;
  company: string;
  city: string;
  status: string;
  opened: string;
  verification: string;
  reason: string;
  caveat: string;
  linkSummary: string; // "ANSR (setup, verified); Infosys (talent, claimed)"
}

const CITY_ALIAS: Record<string, string> = { bangalore: "Bengaluru", gurgaon: "Gurugram", vizag: "Visakhapatnam", cochin: "Kochi" };
export const BIG_METROS = ["Bengaluru", "Hyderabad", "Pune", "Mumbai", "Chennai", "Gurugram", "Delhi", "Noida", "Kolkata"];

const SECTOR_WORDS: Array<[string, RegExp]> = [
  ["BFSI", /\b(banks?|banking|bfsi|financial|finance|insurance|insurers?|fintech)\b/],
  ["Retail and Consumer", /\b(retail|retailers?|consumer|fmcg)\b/],
  ["Manufacturing and Automotive", /\b(manufactur\w*|automotive|automobile|carmakers?|industrial)\b/],
  ["Technology", /\b(technology|software|saas)\b/],
  ["Energy", /\b(energy|oil)\b/],
  ["Healthcare and Pharma", /\b(healthcare|pharma\w*|medical|life sciences)\b/],
  ["Logistics", /\b(logistics|shipping|airlines?)\b/],
  ["Telecom", /\b(telecom\w*)\b/],
];

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const has = (haystack: string, needle: string) => needle.length > 0 && ` ${haystack} `.includes(` ${needle} `);
const GENERIC_FIRST_WORDS = new Set(["western", "charles", "citizens", "wells", "global", "general"]);

export function planQuestion(question: string, vocab: Vocab): Plan {
  const q = norm(question);
  const raw = question.toLowerCase();

  const cities = new Set<string>();
  for (const c of vocab.cities) if (has(q, norm(c))) cities.add(c);
  for (const [alias, real] of Object.entries(CITY_ALIAS)) if (has(q, alias) && vocab.cities.includes(real)) cities.add(real);

  const outside = /\b(outside|beyond)\b[^.?]*\b(metros?|big cities|major cities|top cities)\b|\btier[ -]?(2|ii|two)\b|\bsmaller cities\b/.test(raw);
  const notCities = outside ? vocab.cities.filter((c) => BIG_METROS.includes(c)) : [];
  if (outside) for (const c of notCities) cities.delete(c);

  let sector = "";
  for (const [name, re] of SECTOR_WORDS) {
    if (vocab.sectors.includes(name) && re.test(raw)) { sector = name; break; }
  }

  const providers = vocab.providers.filter((p) => has(q, norm(p.name))).map((p) => p.slug);

  const companies = vocab.companies.filter((name) => {
    const n = norm(name).replace(/^the /, "");
    if (has(q, n)) return true;
    const first = n.split(" ")[0];
    return n.includes(" ") && first.length >= 5 && !GENERIC_FIRST_WORDS.has(first) && has(q, first);
  });

  const stated = /\bverified\b/.test(raw) ? "verified" : /\bclaimed\b/.test(raw) ? "claimed" : "";
  const status = /\b(announced|upcoming|planned|coming|yet to open|not yet open)\b/.test(raw)
    ? "announced"
    : /\b(operational|already open|up and running|live)\b/.test(raw) ? "operational" : "";
  const wantsProviders = /\b(providers?|partners?|advisors?|advisers?|who (set|built|helped|ran|runs))\b/.test(raw);
  // When the question is about providers, "verified" describes the provider link, not the centre.
  const verification = wantsProviders ? "" : stated;
  const linkVerification = wantsProviders ? stated : "";

  const recognised = Boolean(cities.size || notCities.length || sector || providers.length || companies.length || verification || linkVerification || status);

  const bits: string[] = [];
  if (verification) bits.push(verification);
  if (status) bits.push(status);
  if (sector) bits.push(sector);
  const where = cities.size ? ` in ${[...cities].join(" or ")}` : notCities.length ? " outside the big metros" : "";
  const prov = providers.length ? ` involving ${providers.length === 1 ? "that provider" : "those providers"}` : "";
  const label = `${bits.length ? bits.join(" ") + " " : ""}records${where}${prov}`;

  return { cities: [...cities], notCities, sector, providers, companies, verification, linkVerification, status, wantsProviders, recognised, label };
}

const PROVIDER_LINK = /^(.*) \((.*), (verified|claimed)\)$/;
const cite = (slugs: string[]) => slugs.map((s) => `[${s}]`).join(" ");

// Writes the answer text. Every claim carries a [slug] citation the page turns into a link.
export function composeAnswer(plan: Plan, records: PlanRecord[], total: number): string {
  if (records.length === 0) {
    return `No record in the ledger matches ${plan.label}. The ledger is a sample of 50 centres, so this means none was found here, not that none exists.`;
  }

  // One or a few named companies: say what the record says.
  if (plan.companies.length && records.length <= 4) {
    return records
      .map((r) => {
        const links = r.linkSummary ? `Provider on record: ${r.linkSummary}.` : "No provider link is on record.";
        const state = r.status === "operational" ? `operational${r.opened ? ` since ${r.opened}` : ""}` : `announced${r.opened ? ` for ${r.opened}` : ""}`;
        return `${r.company} has a centre in ${r.city}, ${state} [${r.slug}]. The record is ${r.verification} (${r.reason.toLowerCase()}). ${links}${r.caveat ? ` Note: ${r.caveat}` : ""}`;
      })
      .join("\n\n");
  }

  // "Which providers ...": group the provider links of the matching records.
  if (plan.wantsProviders || plan.providers.length) {
    const byProvider = new Map<string, { verified: string[]; claimed: string[] }>();
    for (const r of records) {
      for (const part of r.linkSummary.split("; ").filter(Boolean)) {
        const m = PROVIDER_LINK.exec(part);
        if (!m || (plan.linkVerification && m[3] !== plan.linkVerification)) continue;
        const entry = byProvider.get(m[1]) ?? { verified: [], claimed: [] };
        entry[m[3] as "verified" | "claimed"].push(r.slug);
        byProvider.set(m[1], entry);
      }
    }
    const withProvider = new Set([...byProvider.values()].flatMap((e) => [...e.verified, ...e.claimed])).size;
    const kind = plan.linkVerification ? `${plan.linkVerification} ` : "";
    if (byProvider.size === 0) {
      return `${total} ${plan.label} are in the ledger, but none has a ${kind}provider link on record. That means no source was found, not that no provider was involved.`;
    }
    const lines = [...byProvider.entries()]
      .sort((a, b) => b[1].verified.length + b[1].claimed.length - (a[1].verified.length + a[1].claimed.length))
      .slice(0, 6)
      .map(([name, e]) => {
        const counts = plan.linkVerification ? `${(plan.linkVerification === "verified" ? e.verified : e.claimed).length} ${plan.linkVerification}` : `${e.verified.length} verified, ${e.claimed.length} claimed`;
        return `${name}: ${counts} ${cite([...e.verified, ...e.claimed].slice(0, 3))}`;
      });
    return `Of ${total} ${plan.label}, ${withProvider} name a ${kind}provider on record.\n\n${lines.join("\n")}\n\nA provider link is only "verified" when the client company confirms it or two independent publishers report it.`;
  }

  // Default: a short list with the verification split.
  const verified = records.filter((r) => r.verification === "verified").length;
  const shown = records.slice(0, 8);
  const more = total - shown.length;
  return `${total} ${plan.label} in the ledger (${verified} verified): ${shown.map((r) => cite([r.slug])).join(", ")}${more > 0 ? `, and ${more} more` : ""}.`;
}
