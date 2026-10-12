import type { Facet, GccDetail, GccSummary, ProviderLink, SourceRef } from "@/lib/types";
import { db } from "@/lib/db/client";
import { ftsQuery, stmt } from "./sql";

const SUMMARY_COLUMNS = `
  g.id, g.slug, c.name AS company, c.hq_country AS hq, c.sector, ci.name AS city, ci.state,
  g.status, g.opened, g.verification, g.reason, g.source_count AS sourceCount,
  COALESCE((SELECT replace(group_concat(DISTINCT p.name), ',', ', ')
            FROM engagement e JOIN provider p ON p.id = e.provider_id WHERE e.gcc_id = g.id), '') AS providers`;
const FROM = `FROM gcc g JOIN company c ON c.id = g.company_id JOIN city ci ON ci.id = g.city_id`;

export interface GccQuery {
  q?: string;
  city?: string;
  sector?: string;
  provider?: string; // provider slug
  verification?: string;
  status?: string;
  // Used by Ask, which can name several values at once.
  cities?: string[];
  notCities?: string[];
  companies?: string[];
  providerSlugs?: string[];
  page?: number;
  pageSize?: number;
}

const marks = (n: number) => Array(n).fill("?").join(",");

// Builds the WHERE clause once so search and Ask filter in exactly the same way. Every value is a bound parameter.
function buildWhere(query: GccQuery): { clause: string; params: Array<string | number> } {
  const where: string[] = [];
  const params: Array<string | number> = [];

  const match = query.q ? ftsQuery(query.q, "AND") : "";
  if (match) {
    where.push("g.id IN (SELECT rowid FROM gcc_fts WHERE gcc_fts MATCH ?)");
    params.push(match);
  }
  if (query.city) { where.push("ci.name = ?"); params.push(query.city); }
  if (query.cities?.length) { where.push(`ci.name IN (${marks(query.cities.length)})`); params.push(...query.cities); }
  if (query.notCities?.length) { where.push(`ci.name NOT IN (${marks(query.notCities.length)})`); params.push(...query.notCities); }
  if (query.companies?.length) { where.push(`c.name IN (${marks(query.companies.length)})`); params.push(...query.companies); }
  if (query.sector) { where.push("c.sector = ?"); params.push(query.sector); }
  if (query.verification === "verified" || query.verification === "claimed") { where.push("g.verification = ?"); params.push(query.verification); }
  if (query.status === "operational" || query.status === "announced") { where.push("g.status = ?"); params.push(query.status); }
  if (query.provider) {
    where.push("EXISTS (SELECT 1 FROM engagement e JOIN provider p ON p.id = e.provider_id WHERE e.gcc_id = g.id AND p.slug = ?)");
    params.push(query.provider);
  }
  if (query.providerSlugs?.length) {
    where.push(`EXISTS (SELECT 1 FROM engagement e JOIN provider p ON p.id = e.provider_id WHERE e.gcc_id = g.id AND p.slug IN (${marks(query.providerSlugs.length)}))`);
    params.push(...query.providerSlugs);
  }
  return { clause: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

export function searchGccs(query: GccQuery): { items: GccSummary[]; total: number; page: number; pageSize: number } {
  const { clause, params } = buildWhere(query);
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);
  const page = Math.max(query.page ?? 1, 1);

  // The filter set varies per request, so these two statements are built per call; all values stay parameterised.
  const total = (db().prepare(`SELECT COUNT(*) AS n ${FROM} ${clause}`).get(...params) as { n: number }).n;
  const items = db()
    .prepare(`SELECT ${SUMMARY_COLUMNS} ${FROM} ${clause} ORDER BY g.verification DESC, c.name LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize) as unknown as GccSummary[];
  return { items, total, page, pageSize };
}

type SourceRow = SourceRef & { subjectId: number };
const SOURCES_SQL = (subject: "gcc" | "engagement", idClause: string) => `
  SELECT ev.subject_id AS subjectId, s.id, s.url, s.publisher, s.published, s.origin, ev.supports
  FROM evidence ev JOIN source s ON s.id = ev.source_id
  WHERE ev.subject_type = '${subject}' AND ev.subject_id ${idClause}
  ORDER BY s.published DESC`;

export function getGcc(slug: string): GccDetail | null {
  const row = stmt(`SELECT ${SUMMARY_COLUMNS}, g.focus, g.headcount, g.office, g.caveat ${FROM} WHERE g.slug = ?`).get(slug) as
    | (GccSummary & { focus: string; headcount: string; office: string; caveat: string })
    | undefined;
  if (!row) return null;

  const sources = stmt(SOURCES_SQL("gcc", "= ?")).all(row.id) as unknown as SourceRow[];
  const links = stmt(
    `SELECT e.id AS engagementId, p.slug AS providerSlug, p.name AS providerName, p.type AS providerType, e.role, e.verification, e.reason
     FROM engagement e JOIN provider p ON p.id = e.provider_id WHERE e.gcc_id = ? ORDER BY e.verification DESC, p.name`,
  ).all(row.id) as unknown as Omit<ProviderLink, "sources">[];
  // One query for the sources of every link on this record (no query per link).
  const linkSources = stmt(SOURCES_SQL("engagement", "IN (SELECT id FROM engagement WHERE gcc_id = ?)")).all(row.id) as unknown as SourceRow[];

  return {
    ...row,
    sources,
    links: links.map((l) => ({ ...l, sources: linkSources.filter((s) => s.subjectId === l.engagementId) })),
  };
}

export function facets(): { cities: Facet[]; sectors: Facet[]; providers: Array<Facet & { slug: string }> } {
  return {
    cities: stmt(`SELECT ci.name AS value, COUNT(*) AS count FROM gcc g JOIN city ci ON ci.id = g.city_id GROUP BY ci.id ORDER BY count DESC, value`).all() as unknown as Facet[],
    sectors: stmt(`SELECT c.sector AS value, COUNT(*) AS count FROM gcc g JOIN company c ON c.id = g.company_id GROUP BY c.sector ORDER BY count DESC, value`).all() as unknown as Facet[],
    providers: stmt(`SELECT p.name AS value, p.slug, COUNT(*) AS count FROM engagement e JOIN provider p ON p.id = e.provider_id GROUP BY p.id ORDER BY count DESC, value`).all() as unknown as Array<Facet & { slug: string }>,
  };
}

const STOP = new Set(
  "a an the of in on at to for with by from and or is are was were be been do does did which what who whom where when how many much has have had that this these those it its their there any all most more than into about set up setup gcc gccs centre centres center centers india company companies provider providers me show list tell".split(" "),
);

export interface ContextRecord extends GccSummary { focus: string; headcount: string; office: string; caveat: string; linkSummary: string }

// Retrieval step for the Ask feature: best-matching records by BM25 rank.
export function retrieve(question: string, limit = 20): ContextRecord[] {
  const match = ftsQuery(question, "OR", STOP);
  if (!match) return [];
  return db()
    .prepare(
      `SELECT ${SUMMARY_COLUMNS}, g.focus, g.headcount, g.office, g.caveat,
         COALESCE((SELECT group_concat(p.name || ' (' || e.role || ', ' || e.verification || ')', '; ')
                   FROM engagement e JOIN provider p ON p.id = e.provider_id WHERE e.gcc_id = g.id), '') AS linkSummary
       ${FROM} JOIN (SELECT rowid, bm25(gcc_fts) AS rank FROM gcc_fts WHERE gcc_fts MATCH ? ORDER BY rank LIMIT ?) hit ON hit.rowid = g.id
       ORDER BY hit.rank`,
    )
    .all(match, limit) as unknown as ContextRecord[];
}

// Records chosen by explicit filters (the Ask planner). Same shape as retrieve(), so the answer code treats both alike.
export function filterContext(query: GccQuery, limit = 60): { records: ContextRecord[]; total: number } {
  const { clause, params } = buildWhere(query);
  const total = (db().prepare(`SELECT COUNT(*) AS n ${FROM} ${clause}`).get(...params) as { n: number }).n;
  const records = db()
    .prepare(
      `SELECT ${SUMMARY_COLUMNS}, g.focus, g.headcount, g.office, g.caveat,
         COALESCE((SELECT group_concat(p.name || ' (' || e.role || ', ' || e.verification || ')', '; ')
                   FROM engagement e JOIN provider p ON p.id = e.provider_id WHERE e.gcc_id = g.id), '') AS linkSummary
       ${FROM} ${clause} ORDER BY g.verification DESC, c.name LIMIT ?`,
    )
    .all(...params, limit) as unknown as ContextRecord[];
  return { records, total };
}

export function companyNames(): string[] {
  return (stmt(`SELECT DISTINCT c.name AS name FROM company c JOIN gcc g ON g.company_id = c.id`).all() as unknown as Array<{ name: string }>).map((r) => r.name);
}
