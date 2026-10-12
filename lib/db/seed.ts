import type { DatabaseSync } from "node:sqlite";
import seed from "@/data/seed.json";
import { assess, type Origin } from "@/lib/domain/verification";

interface RawSource { url: string; publisher: string; published: string; origin: string; supports: string }

export const slugify = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function seedDatabase(db: DatabaseSync): void {
  const insCity = db.prepare("INSERT OR IGNORE INTO city (name, state) VALUES (?, ?)");
  const getCity = db.prepare("SELECT id FROM city WHERE name = ?");
  const insCompany = db.prepare("INSERT OR IGNORE INTO company (name, hq_country, sector) VALUES (?, ?, ?)");
  const getCompany = db.prepare("SELECT id FROM company WHERE name = ?");
  const insGcc = db.prepare(
    `INSERT INTO gcc (slug, company_id, city_id, status, opened, focus, headcount, office, caveat, verification, reason, source_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const getGcc = db.prepare("SELECT id FROM gcc WHERE company_id = ? AND city_id = ?");
  const insProvider = db.prepare("INSERT OR IGNORE INTO provider (slug, name, type) VALUES (?, ?, ?)");
  const getProvider = db.prepare("SELECT id FROM provider WHERE name = ?");
  const insEngagement = db.prepare("INSERT INTO engagement (gcc_id, provider_id, role, verification, reason) VALUES (?, ?, ?, ?, ?)");
  const insSource = db.prepare("INSERT OR IGNORE INTO source (url, publisher, published, origin) VALUES (?, ?, ?, ?)");
  const getSource = db.prepare("SELECT id FROM source WHERE url = ?");
  const insEvidence = db.prepare("INSERT OR IGNORE INTO evidence (subject_type, subject_id, source_id, supports) VALUES (?, ?, ?, ?)");
  const insFts = db.prepare("INSERT INTO gcc_fts (rowid, company, city, state, sector, focus, providers, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

  const id = (row: unknown) => (row as { id: number }).id;
  const attach = (type: "gcc" | "engagement", subjectId: number, sources: RawSource[]) => {
    for (const s of sources) {
      insSource.run(s.url, s.publisher, s.published, s.origin);
      insEvidence.run(type, subjectId, id(getSource.get(s.url)), s.supports);
    }
  };
  const judge = (sources: RawSource[]) => assess(sources.map((s) => ({ publisher: s.publisher, origin: s.origin as Origin })));

  db.exec("BEGIN");
  try {
    const providersByGcc = new Map<number, string[]>();
    const tagsByGcc = new Map<number, string[]>(); // searchable words: link role and status

    for (const g of seed.gccs) {
      insCity.run(g.city, g.state);
      insCompany.run(g.company, g.hq, g.sector);
      const cityId = id(getCity.get(g.city));
      const companyId = id(getCompany.get(g.company));
      const v = judge(g.sources);
      insGcc.run(slugify(`${g.company} ${g.city}`), companyId, cityId, g.status, g.opened, g.focus, g.headcount, g.office, g.caveat, v.verification, v.reason, g.sources.length);
      attach("gcc", id(getGcc.get(companyId, cityId)), g.sources);
    }

    for (const e of seed.engagements) {
      const gccId = id(getGcc.get(id(getCompany.get(e.company)), id(getCity.get(e.city))));
      insProvider.run(slugify(e.provider), e.provider, e.providerType);
      const v = judge(e.sources);
      const res = insEngagement.run(gccId, id(getProvider.get(e.provider)), e.role, v.verification, v.reason);
      attach("engagement", Number(res.lastInsertRowid), e.sources);
      providersByGcc.set(gccId, [...(providersByGcc.get(gccId) ?? []), e.provider]);
      tagsByGcc.set(gccId, [...(tagsByGcc.get(gccId) ?? []), e.role, v.verification, e.providerType]);
    }

    const rows = db
      .prepare(
        `SELECT g.id, g.status, c.name AS company, ci.name AS city, ci.state, c.sector, g.focus
         FROM gcc g JOIN company c ON c.id = g.company_id JOIN city ci ON ci.id = g.city_id`,
      )
      .all() as Array<{ id: number; status: string; company: string; city: string; state: string; sector: string; focus: string }>;
    for (const r of rows) {
      insFts.run(r.id, r.company, r.city, r.state, r.sector, r.focus, (providersByGcc.get(r.id) ?? []).join(" "), [r.status, ...(tagsByGcc.get(r.id) ?? [])].join(" "));
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
