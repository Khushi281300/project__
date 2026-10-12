import type { Stats } from "@/lib/types";
import { stmt } from "./sql";

export function getStats(): Stats {
  const row = stmt(
    `SELECT
       (SELECT COUNT(*) FROM gcc) AS gccs,
       (SELECT COUNT(*) FROM gcc WHERE verification = 'verified') AS gccsVerified,
       (SELECT COUNT(*) FROM engagement) AS links,
       (SELECT COUNT(*) FROM engagement WHERE verification = 'verified') AS linksVerified,
       (SELECT COUNT(*) FROM provider) AS providers,
       (SELECT COUNT(*) FROM city) AS cities,
       (SELECT COUNT(*) FROM source) AS sources,
       (SELECT COUNT(*) FROM gcc WHERE source_count >= 2) AS multi`,
  ).get() as unknown as Omit<Stats, "multiSourceShare"> & { multi: number };
  const { multi, ...rest } = row;
  return { ...rest, multiSourceShare: rest.gccs ? multi / rest.gccs : 0 };
}
