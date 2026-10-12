export type Origin = "independent" | "government" | "company" | "provider";
export type Verification = "verified" | "claimed";
export type GccStatus = "operational" | "announced";
export type Role = "setup" | "build-operate" | "workspace" | "talent" | "advisory";

export interface SourceRef {
  id: number;
  url: string;
  publisher: string;
  published: string;
  origin: Origin;
  supports: string;
}

export interface ProviderLink {
  engagementId: number;
  providerSlug: string;
  providerName: string;
  providerType: string;
  role: Role;
  verification: Verification;
  reason: string;
  sources: SourceRef[];
}

export interface GccSummary {
  id: number;
  slug: string;
  company: string;
  hq: string;
  sector: string;
  city: string;
  state: string;
  status: GccStatus;
  opened: string;
  verification: Verification;
  reason: string;
  sourceCount: number;
  providers: string; // comma separated names, empty when none on record
}

export interface GccDetail extends GccSummary {
  focus: string;
  headcount: string;
  office: string;
  caveat: string;
  sources: SourceRef[];
  links: ProviderLink[];
}

export interface ProviderSummary {
  id: number;
  slug: string;
  name: string;
  type: string;
  verifiedLinks: number;
  claimedLinks: number;
}

export interface ProviderDetail extends ProviderSummary {
  links: Array<ProviderLink & { gccSlug: string; company: string; city: string; opened: string }>;
}

export interface Facet { value: string; count: number }

export interface Stats {
  gccs: number;
  gccsVerified: number;
  links: number;
  linksVerified: number;
  providers: number;
  cities: number;
  sources: number;
  multiSourceShare: number; // share of GCC records with two or more sources, 0..1
}

export interface Submission {
  id: number;
  createdAt: string;
  company: string;
  city: string;
  provider: string;
  role: string;
  sourceUrl: string;
  note: string;
  status: "pending";
}
