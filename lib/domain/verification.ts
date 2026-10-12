// The one rule that decides a record's status. Pure and dependency-free so it can be unit tested.
//
//   verified  = the company itself confirms it, OR two independent publishers agree
//   claimed   = anything less (one independent source, or only the provider's own word)
//
// Wire copy is counted once: the same PTI or Reuters story on two sites is one publisher.

export type Origin = "independent" | "government" | "company" | "provider";
export type Verification = "verified" | "claimed";

export interface SourceLike {
  publisher: string;
  origin: Origin;
}

const WIRES = ["reuters", "pti", "ani", "ians", "uni", "prnewswire"];

export function publisherKey(publisher: string): string {
  const p = publisher.toLowerCase();
  for (const wire of WIRES) {
    if (new RegExp(`\\b${wire}\\b`).test(p)) return wire;
  }
  return p.replace(/\s*\(.*?\)\s*/g, " ").trim();
}

export function assess(sources: SourceLike[]): { verification: Verification; reason: string } {
  if (sources.some((s) => s.origin === "company")) {
    return { verification: "verified", reason: "Confirmed by the company itself" };
  }
  const independent = new Set(
    sources.filter((s) => s.origin === "independent" || s.origin === "government").map((s) => publisherKey(s.publisher)),
  );
  if (independent.size >= 2) {
    return { verification: "verified", reason: `${independent.size} independent publishers agree` };
  }
  if (independent.size === 1) {
    return { verification: "claimed", reason: "One independent source so far" };
  }
  return { verification: "claimed", reason: "The provider's own claim only" };
}
