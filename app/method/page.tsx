import type { Metadata } from "next";
import Link from "next/link";
import { getStats } from "@/lib/repo/statsRepo";

export const metadata: Metadata = { title: "Method and API" };

const ENDPOINTS = [
  ["GET", "/api/v1/gccs", "Search and filter records. Query: q, city, sector, provider, verification, status, page, pageSize."],
  ["GET", "/api/v1/gccs/:slug", "One record with all its sources and provider links."],
  ["GET", "/api/v1/providers", "All providers with verified and claimed link counts."],
  ["GET", "/api/v1/providers/:slug", "One provider's track record with sources."],
  ["GET", "/api/v1/stats", "Headline counts and filter options."],
  ["POST", "/api/v1/plan", "Body: { headcount, sector, city, operatingModel }. Generates strategic feasibility & budget plan."],
  ["POST", "/api/v1/ask", "Body: { question }. Returns an answer that cites records, plus the records."],
  ["POST", "/api/v1/extract", "Body: { text }. AI proposes submission fields from pasted article text."],
  ["GET, POST", "/api/v1/submissions", "The review queue. POST needs company, city and sourceUrl."],
  ["GET", "/api/v1/health", "Liveness, and whether AI features are on."],
];

export default function MethodPage() {
  const s = getStats();
  return (
    <div className="stack-lg">
      <section className="hero">
        <p className="eyebrow">Method and API</p>
        <h1>One rule decides every status</h1>
        <p>The rule is short on purpose, so anyone can check a record against it.</p>
      </section>

      <div className="grid-2">
        <section className="card stack prose">
          <h2>The rule</h2>
          <p><span className="badge verified">Verified</span> The company that owns the centre confirms it, or two independent publishers report it.</p>
          <p><span className="badge claimed">Claimed</span> Anything less: one independent source, or only the provider&apos;s own material.</p>
          <p>The same wire story printed on two sites counts once. A provider&apos;s own website never verifies its own claim. The rule applies separately to the centre and to each provider link.</p>
        </section>
        <section className="card stack prose">
          <h2>What this sample is</h2>
          <p>{s.gccs} GCC records and {s.links} provider links, drawn from {s.sources} source pages read in October 2026. It is a real sample, not a census: India has 2,117 GCCs by the Nasscom and Zinnov FY26 count, and other sources say anything from 1,700 to 2,800 (see <Link href="/market">Market numbers</Link>).</p>
          <p>Summaries of sources are paraphrased. Where a source uses a different label, such as &quot;technology hub&quot;, the record says so.</p>
          <p>A missing provider link means no source was found. It does not mean no provider was involved.</p>
        </section>
      </div>

      <section className="card stack prose">
        <h2>How a record is built</h2>
        <ol>
          <li><b>Collect.</b> Press coverage, government statements, company releases and provider case studies.</li>
          <li><b>Extract.</b> An AI model pulls out the company, city and provider. Try it on the <Link href="/submit">Submit evidence</Link> page.</li>
          <li><b>Reconcile.</b> One company under several names is merged; each source is stored once and linked to every record it supports.</li>
          <li><b>Confirm.</b> A person checks the source. The status is then computed by the rule above, never set by hand.</li>
        </ol>
      </section>

      <section className="stack">
        <h2>API</h2>
        <p className="muted">JSON over HTTP. Success returns <code>{"{ data, meta? }"}</code>; failure returns <code>{"{ error: { code, message } }"}</code>.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Method</th><th>Path</th><th>What it does</th></tr></thead>
            <tbody>
              {ENDPOINTS.map(([m, p, d]) => (
                <tr key={p + m}><td data-label="Method"><span className="tag">{m}</span></td><td data-label="Path"><code>{p}</code></td><td>{d}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre>{`curl "/api/v1/gccs?city=Hyderabad&verification=verified&pageSize=5"`}</pre>
      </section>
    </div>
  );
}
