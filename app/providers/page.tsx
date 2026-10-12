import type { Metadata } from "next";
import Link from "next/link";
import { listProviders } from "@/lib/repo/providerRepo";

export const metadata: Metadata = { title: "Providers" };

export default function ProvidersPage() {
  const providers = listProviders();
  return (
    <div className="stack-lg">
      <section className="hero">
        <p className="eyebrow">Track records</p>
        <h1>Providers, by what can be shown</h1>
        <p>A link counts as verified when the client company confirms it or two independent publishers report it. Otherwise it stays claimed. Ordered by verified links.</p>
      </section>
      <div className="grid-3">
        {providers.map((p) => {
          const total = p.verifiedLinks + p.claimedLinks;
          return (
            <Link key={p.id} href={`/providers/${p.slug}`} className="card stack" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="row between" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                <div>
                  <h3>{p.name}</h3>
                  <p className="muted small">{p.type}</p>
                </div>
                <span className="big" aria-hidden="true">{p.verifiedLinks}</span>
              </div>
              <div className="bar" aria-hidden="true">
                {p.verifiedLinks > 0 && <i className="v" style={{ flex: p.verifiedLinks }} />}
                {p.claimedLinks > 0 && <i className="c" style={{ flex: p.claimedLinks }} />}
              </div>
              <p className="small muted">{p.verifiedLinks} verified, {p.claimedLinks} claimed, of {total} {total === 1 ? "link" : "links"} on record</p>
            </Link>
          );
        })}
      </div>
      <p className="muted small">Counts cover this prototype&apos;s sample only. A short list here says nothing about a provider&apos;s full client base.</p>
    </div>
  );
}
