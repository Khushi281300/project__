import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ROLE_LABEL, SourceList } from "@/components/ui";
import { getGcc, searchGccs } from "@/lib/repo/gccRepo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return searchGccs({ pageSize: 100 }).items.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = getGcc((await params).slug);
  return { title: g ? `${g.company}, ${g.city}` : "Record not found" };
}

export default async function GccPage({ params }: Props) {
  const g = getGcc((await params).slug);
  if (!g) notFound();

  return (
    <div className="stack-lg">
      <div className="stack">
        <p className="crumb"><Link href="/">Records</Link> / {g.company}</p>
        <div className="row">
          <h1>{g.company}, {g.city}</h1>
          <Badge status={g.verification} />
        </div>
        <p className="muted">{g.reason}. {g.sourceCount} {g.sourceCount === 1 ? "source" : "sources"} on this record.</p>
      </div>

      {g.caveat && <p className="callout"><b>Read with care:</b> {g.caveat}</p>}

      <div className="grid-2">
        <section className="card stack">
          <h2>The centre</h2>
          <dl className="facts">
            <dt>Parent headquarters</dt><dd>{g.hq || "Not stated in the sources"}</dd>
            <dt>Sector</dt><dd>{g.sector}</dd>
            <dt>Location</dt><dd>{g.city}{g.state ? `, ${g.state}` : ""}</dd>
            <dt>Stage</dt><dd>{g.status === "operational" ? "Operational" : "Announced"}{g.opened ? `, ${g.opened}` : ""}</dd>
            {g.focus && (<><dt>Work done there</dt><dd>{g.focus}</dd></>)}
            {g.headcount && (<><dt>People</dt><dd>{g.headcount}</dd></>)}
            {g.office && (<><dt>Office</dt><dd>{g.office}</dd></>)}
          </dl>
        </section>

        <section className="card stack">
          <h2>Providers on record</h2>
          {g.links.length === 0 ? (
            <p className="muted">No provider link is on record for this centre. That means no source was found, not that no provider was involved. <Link href="/submit">Submit evidence</Link>.</p>
          ) : (
            g.links.map((l) => (
              <div key={l.engagementId} className="stack link-block" style={{ gap: 10 }}>
                <div className="row">
                  <h3><Link href={`/providers/${l.providerSlug}`}>{l.providerName}</Link></h3>
                  <span className="tag">{ROLE_LABEL[l.role]}</span>
                  <Badge status={l.verification} />
                </div>
                <p className="muted small">{l.reason}</p>
                <SourceList sources={l.sources} />
              </div>
            ))
          )}
        </section>
      </div>

      <section className="card stack">
        <h2>Sources for this record</h2>
        <SourceList sources={g.sources} />
      </section>
    </div>
  );
}
