import type { Metadata } from "next";
import { COUNTS, CITIES, REAL_ESTATE } from "@/data/market";
import { facets } from "@/lib/repo/gccRepo";
import MarketClient from "./MarketClient";

export const metadata: Metadata = {
  title: "Market numbers & City Benchmarks",
  description: "Discrepancies in GCC counts, city-wise distribution, talent cost indices, and state government incentive policies.",
};

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const KIND_LABEL = { published: "Published", vendor: "Vendor data", ours: "This ledger" } as const;

export default function MarketPage() {
  const sample = new Map(facets().cities.map((c) => [c.value, c.count]));
  const max = Math.max(...COUNTS.map((c) => c.value));
  const sorted = [...COUNTS].sort((a, b) => b.value - a.value);

  return (
    <div className="stack-lg">
      <section className="hero">
        <p className="eyebrow">Market Intelligence & Benchmarks</p>
        <h1>Nobody agrees how many GCCs India has</h1>
        <p>Published counts run from 536 to 2,800 depending on who is counting and what counts. This page presents the disparate market figures side by side with their primary sources, paired with verified city benchmarks.</p>
      </section>

      {/* Discrepancy Breakdown */}
      <section className="stack" aria-label="How many GCCs">
        <h2>How many GCCs are there in India?</h2>
        <div className="card stack">
          {sorted.map((c) => (
            <div key={c.who} className="hbar">
              <div className="hbar-head">
                <b>{c.who}</b>
                <span className="tag">{KIND_LABEL[c.kind]}</span>
              </div>
              <div className="hbar-track"><i className={c.kind === "ours" ? "ours" : ""} style={{ width: `${Math.max((c.value / max) * 100, 1.5)}%` }} /></div>
              <p className="small muted"><span className="num">{c.value.toLocaleString("en-IN")}</span> {c.unit}. {c.note} {c.url.startsWith("http") ? <a href={c.url} {...ext}>Source</a> : null}</p>
            </div>
          ))}
        </div>
        <p className="notice">Why the spread: some sources count parent companies, others count individual centres, and sales-data vendors count any company with a foreign HQ and staff in India. A source-backed record, one row per centre, is the only way to make the definitions visible.</p>
      </section>

      {/* Which Cities Lead Comparison */}
      <section className="stack" aria-label="Which cities lead">
        <h2>Which cities lead?</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>City</th><th>Vestian (GCCs)</th><th>A second published figure</th><th>This ledger (sample)</th></tr></thead>
            <tbody>
              {CITIES.map((c) => (
                <tr key={c.city}>
                  <td><b>{c.city}</b></td>
                  <td data-label="Vestian" className="num">{c.vestian ?? "—"}</td>
                  <td data-label="Second figure">{c.otherUrl ? <a href={c.otherUrl} {...ext}>{c.other}</a> : <span className="muted">{c.other}</span>}</td>
                  <td data-label="This ledger" className="num">{sample.get(c.city) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="callout"><b>Do not read the last column as a ranking.</b> The ledger sample was gathered from recent press coverage, which is uneven by city. Published sources put Bengaluru first by a wide margin, followed by Hyderabad and Pune.</p>
      </section>

      {/* Interactive City Benchmarks and State Policy Matrix */}
      <MarketClient />

      {/* Real Estate Absorption */}
      <section className="stack" aria-label="Office space">
        <h2>How much office space do GCCs take?</h2>
        <div className="grid-3">
          {REAL_ESTATE.map((r) => (
            <div key={r.figure} className="card stack">
              <span className="big">{r.figure}</span>
              <p className="small">{r.what}</p>
              <a className="small" href={r.url} {...ext}>Source</a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
