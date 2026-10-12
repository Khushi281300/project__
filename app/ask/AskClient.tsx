"use client";

import Link from "next/link";
import { useState } from "react";

interface Record_ { slug: string; company: string; city: string; verification: "verified" | "claimed"; providers: string; status: string; opened: string }
interface Result { mode: "ai" | "rules" | "retrieval"; answer: string | null; cited: string[]; records: Record_[]; notice?: string }

const EXAMPLES = [
  "Which providers have a verified set-up in Hyderabad?",
  "Which retail companies opened a centre in Bengaluru?",
  "What do we know about T-Mobile's centre?",
  "Which centres are outside the big metros?",
];

export default function AskClient() {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function run(q: string) {
    const text = q.trim();
    if (text.length < 3 || busy) return;
    setQuestion(text);
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/v1/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: text }) });
      const body = await res.json();
      if (!res.ok) setError(body?.error?.message ?? "Something went wrong. Try again.");
      else setResult(body.data as Result);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  // Turn [slug] citations in the answer into links to the cited record.
  const renderAnswer = (answer: string, records: Record_[]) => {
    const bySlug = new Map(records.map((r) => [r.slug, r]));
    return answer.split(/(\[[a-z0-9-]+\])/g).map((part, i) => {
      const rec = bySlug.get(part.slice(1, -1));
      return rec && part.startsWith("[") ? <Link key={i} href={`/gcc/${rec.slug}`}>[{rec.company}]</Link> : <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="stack-lg">
      <form className="card stack" onSubmit={(e) => { e.preventDefault(); run(question); }}>
        <div className="field">
          <label htmlFor="question">Your question</label>
          <input id="question" type="text" value={question} maxLength={300} onChange={(e) => setQuestion(e.target.value)} placeholder="For example: who set up centres for banks in Hyderabad?" />
        </div>
        <div className="row between">
          <div className="chips">
            {EXAMPLES.map((ex) => <button key={ex} type="button" className="chip" onClick={() => run(ex)}>{ex}</button>)}
          </div>
          <button className="btn" type="submit" disabled={busy || question.trim().length < 3}>{busy ? "Reading the ledger…" : "Ask"}</button>
        </div>
      </form>

      <div aria-live="polite" className="stack-lg">
        {error && <p className="error">{error}</p>}
        {result && (
          <>
            {result.notice && <p className="notice">{result.notice}</p>}
            {result.answer && (
              <section className="card stack">
                <h2>Answer</h2>
                <p className="answer">{renderAnswer(result.answer, result.records)}</p>
                <p className="muted small">{result.mode === "ai" ? "Written by an AI model from the records below only. Follow the links to check each one." : "Assembled from the records below by fixed rules. Follow the links to check each one."}</p>
              </section>
            )}
            <section className="stack">
              <h2>{result.answer ? "Records behind the answer" : "Best-matching records"}</h2>
              {result.records.length === 0 ? (
                <p className="card muted">No record matched the words in that question. Try a company, city, sector or provider name.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Company</th><th>City</th><th>Centre</th><th>Provider on record</th><th>Record</th></tr></thead>
                    <tbody>
                      {result.records.map((r) => (
                        <tr key={r.slug}>
                          <td><Link className="name" href={`/gcc/${r.slug}`}>{r.company}</Link>{result.cited.includes(r.slug) && <span className="tag" style={{ marginLeft: 8 }}>Cited</span>}</td>
                          <td data-label="City">{r.city}</td>
                          <td data-label="Centre">{r.status === "operational" ? "Operational" : "Announced"}{r.opened ? `, ${r.opened}` : ""}</td>
                          <td data-label="Provider on record">{r.providers || <span className="muted">None on record</span>}</td>
                          <td><span className={`badge ${r.verification}`}>{r.verification === "verified" ? "Verified" : "Claimed"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
