import type { ProviderDetail, ProviderSummary, SourceRef } from "@/lib/types";
import { stmt } from "./sql";

const SUMMARY = `
  SELECT p.id, p.slug, p.name, p.type,
         COALESCE(SUM(e.verification = 'verified'), 0) AS verifiedLinks,
         COALESCE(SUM(e.verification = 'claimed'), 0)  AS claimedLinks
  FROM provider p LEFT JOIN engagement e ON e.provider_id = p.id`;

export function listProviders(): ProviderSummary[] {
  return stmt(`${SUMMARY} GROUP BY p.id ORDER BY verifiedLinks DESC, claimedLinks DESC, p.name`).all() as unknown as ProviderSummary[];
}

export function getProvider(slug: string): ProviderDetail | null {
  const row = stmt(`${SUMMARY} WHERE p.slug = ? GROUP BY p.id`).get(slug) as ProviderSummary | undefined;
  if (!row) return null;

  const links = stmt(
    `SELECT e.id AS engagementId, p.slug AS providerSlug, p.name AS providerName, p.type AS providerType, e.role, e.verification, e.reason,
            g.slug AS gccSlug, c.name AS company, ci.name AS city, g.opened
     FROM engagement e
     JOIN provider p ON p.id = e.provider_id
     JOIN gcc g ON g.id = e.gcc_id JOIN company c ON c.id = g.company_id JOIN city ci ON ci.id = g.city_id
     WHERE e.provider_id = ? ORDER BY e.verification DESC, c.name`,
  ).all(row.id) as unknown as Omit<ProviderDetail["links"][number], "sources">[];

  const sources = stmt(
    `SELECT ev.subject_id AS subjectId, s.id, s.url, s.publisher, s.published, s.origin, ev.supports
     FROM evidence ev JOIN source s ON s.id = ev.source_id
     WHERE ev.subject_type = 'engagement' AND ev.subject_id IN (SELECT id FROM engagement WHERE provider_id = ?)`,
  ).all(row.id) as unknown as Array<SourceRef & { subjectId: number }>;

  return { ...row, links: links.map((l) => ({ ...l, sources: sources.filter((s) => s.subjectId === l.engagementId) })) };
}
