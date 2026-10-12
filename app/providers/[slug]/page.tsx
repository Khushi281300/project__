import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ROLE_LABEL, SourceList } from "@/components/ui";
import { getProvider, listProviders } from "@/lib/repo/providerRepo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listProviders().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProvider((await params).slug);
  return { title: p ? p.name : "Provider not found" };
}

export default async function ProviderPage({ params }: Props) {
  const p = getProvider((await params).slug);
  if (!p) notFound();

  const groups = [
    { title: "Verified", note: "Confirmed by the client company, or reported by two independent publishers.", links: p.links.filter((l) => l.verification === "verified") },
    { title: "Claimed", note: "Backed by one independent source, or only by the provider's own material.", links: p.links.filter((l) => l.verification === "claimed") },
  ];

  return (
    <div className="stack-lg">
      <div className="stack">
        <p className="crumb"><Link href="/providers">Providers</Link> / {p.name}</p>
        <h1>{p.name}</h1>
        <p className="muted">{p.type}. {p.verifiedLinks} verified and {p.claimedLinks} claimed {p.links.length === 1 ? "link" : "links"} in this sample.</p>
      </div>

      {groups.map((grp) => (
        <section key={grp.title} className="stack">
          <div>
            <h2>{grp.title} ({grp.links.length})</h2>
            <p className="muted small">{grp.note}</p>
          </div>
          {grp.links.length === 0 ? (
            <p className="card muted">Nothing in this group yet.</p>
          ) : (
            grp.links.map((l) => (
              <div key={l.engagementId} className="card stack">
                <div className="row">
                  <h3><Link href={`/gcc/${l.gccSlug}`}>{l.company}, {l.city}</Link></h3>
                  <span className="tag">{ROLE_LABEL[l.role]}</span>
                  <Badge status={l.verification} />
                  {l.opened && <span className="muted small">{l.opened}</span>}
                </div>
                <p className="muted small">{l.reason}</p>
                <SourceList sources={l.sources} />
              </div>
            ))
          )}
        </section>
      ))}
    </div>
  );
}
