import Link from "next/link";
import { Badge } from "@/components/ui";
import { facets, searchGccs } from "@/lib/repo/gccRepo";
import { getStats } from "@/lib/repo/statsRepo";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function LedgerPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const f = { q: one(sp.q), city: one(sp.city), sector: one(sp.sector), provider: one(sp.provider), verification: one(sp.verification) };
  const page = Math.max(parseInt(one(sp.page) || "1", 10) || 1, 1);

  const stats = getStats();
  const options = facets();
  const { items, total, pageSize } = searchGccs({ ...f, page, pageSize: 15 });
  const pages = Math.max(Math.ceil(total / pageSize), 1);
  const filtered = Object.values(f).some(Boolean);

  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <div className="stack-lg">
      <section className="hero">
        <p className="eyebrow">India&apos;s Global Capability Centres</p>
        <h1>Who built which GCC, and with whose help. With proof.</h1>
        <p>Every record links to the page it came from. A provider&apos;s own claim stays marked as a claim until a second source backs it.</p>
      </section>

      <section className="stats" aria-label="Ledger at a glance">
        <div className="stat"><b>{stats.gccs}</b><span>GCC records</span></div>
        <div className="stat"><b>{stats.links}</b><span>provider links, {stats.linksVerified} verified</span></div>
        <div className="stat key"><b>{Math.round(stats.multiSourceShare * 100)}%</b><span>of records have two or more sources</span></div>
        <div className="stat"><b>{stats.sources}</b><span>source pages across {stats.cities} cities</span></div>
      </section>

      <section className="stack" aria-label="Records">
        <form className="filters" method="get" action="/">
          <div className="field">
            <label htmlFor="q">Search</label>
            <input id="q" type="search" name="q" defaultValue={f.q} placeholder="Company, city, sector or provider" />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <select id="city" name="city" defaultValue={f.city}>
              <option value="">All cities</option>
              {options.cities.map((c) => <option key={c.value} value={c.value}>{c.value} ({c.count})</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sector">Sector</label>
            <select id="sector" name="sector" defaultValue={f.sector}>
              <option value="">All sectors</option>
              {options.sectors.map((c) => <option key={c.value} value={c.value}>{c.value} ({c.count})</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="provider">Provider</label>
            <select id="provider" name="provider" defaultValue={f.provider}>
              <option value="">Any provider</option>
              {options.providers.map((c) => <option key={c.slug} value={c.slug}>{c.value} ({c.count})</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="verification">Record status</label>
            <select id="verification" name="verification" defaultValue={f.verification}>
              <option value="">Any status</option>
              <option value="verified">Verified</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>
          <button className="btn" type="submit">Apply</button>
        </form>

        <div className="row between">
          <p className="muted small" role="status">{total} {total === 1 ? "record" : "records"}{filtered ? " match these filters" : ""}</p>
          {filtered && <Link className="small" href="/">Clear filters</Link>}
        </div>

        <div className="table-wrap">
          {items.length === 0 ? (
            <p className="empty">No record matches. Clear a filter, or <Link href="/submit">submit evidence</Link> for a GCC that is missing.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Company</th><th>City</th><th>Sector</th><th>Centre</th><th>Provider on record</th><th>Record</th></tr>
              </thead>
              <tbody>
                {items.map((g) => (
                  <tr key={g.id}>
                    <td><div className="co"><span className="avatar" aria-hidden="true">{g.company.replace(/^The /, "")[0]}</span><div><Link className="name" href={`/gcc/${g.slug}`}>{g.company}</Link><div className="muted small">HQ {g.hq || "not stated"}</div></div></div></td>
                    <td data-label="City">{g.city}</td>
                    <td data-label="Sector"><span className="pill">{g.sector}</span></td>
                    <td data-label="Centre" className="nowrap">{g.status === "operational" ? "Operational" : "Announced"}{g.opened && <span className="num"> {g.opened}</span>}</td>
                    <td data-label="Provider on record">{g.providers || <span className="muted">None on record</span>}</td>
                    <td><div className="row" style={{ gap: 8, flexWrap: "nowrap" }}><Badge status={g.verification} /><span className="num">{g.sourceCount} {g.sourceCount === 1 ? "source" : "sources"}</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pages > 1 && (
          <nav className="pager" aria-label="Pages">
            {page > 1 ? <Link className="btn ghost" href={href(page - 1)}>Previous</Link> : <span />}
            <span className="muted small">Page {page} of {pages}</span>
            {page < pages ? <Link className="btn ghost" href={href(page + 1)}>Next</Link> : <span />}
          </nav>
        )}
      </section>
    </div>
  );
}
