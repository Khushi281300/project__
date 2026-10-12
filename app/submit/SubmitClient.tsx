"use client";

import { useEffect, useState } from "react";

interface Submission { id: number; createdAt: string; company: string; city: string; provider: string; role: string; sourceUrl: string; note: string }
const EMPTY = { company: "", city: "", provider: "", role: "", sourceUrl: "", note: "" };
const ROLES = [["", "No provider named"], ["setup", "Set-up partner"], ["build-operate", "Build-operate partner"], ["workspace", "Workspace provider"], ["talent", "Talent partner"], ["advisory", "Advisor"]];

export default function SubmitClient({ aiOn }: { aiOn: boolean }) {
  const [article, setArticle] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [queue, setQueue] = useState<Submission[]>([]);
  const [busy, setBusy] = useState<"" | "extract" | "submit">("");
  const [message, setMessage] = useState<{ kind: "notice" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/v1/submissions").then((r) => r.json()).then((b) => setQueue(b.data ?? [])).catch(() => {});
  }, []);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function call(path: string, payload: unknown) {
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error?.message ?? "Something went wrong. Try again.");
    return body.data;
  }

  async function extract() {
    setBusy("extract");
    setMessage(null);
    try {
      const data = await call("/api/v1/extract", { text: article });
      setForm((f) => ({ ...f, company: data.company, city: data.city, provider: data.provider, role: data.role, note: data.note }));
      setMessage({ kind: "notice", text: "Fields filled from the text. Check each one, add the link to the article, then submit." });
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("submit");
    setMessage(null);
    try {
      const created = await call("/api/v1/submissions", form);
      setQueue((q) => [created, ...q]);
      setForm(EMPTY);
      setArticle("");
      setMessage({ kind: "notice", text: "Added to the review queue. It is published only after a person checks the source." });
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="stack-lg">
      <section className="card stack">
        <h2>1. Paste the article (optional)</h2>
        {aiOn ? (
          <>
            <div className="field">
              <label htmlFor="article">Article or press release text</label>
              <textarea id="article" value={article} onChange={(e) => setArticle(e.target.value)} placeholder="Paste the text. An AI model will pull out the company, city and provider for you to check." />
            </div>
            <div><button type="button" className="btn ghost" onClick={extract} disabled={busy !== "" || article.trim().length < 80}>{busy === "extract" ? "Reading…" : "Fill the form with AI"}</button></div>
          </>
        ) : (
          <p className="notice">AI extraction is off on this deployment (no API key set). Fill the form below by hand.</p>
        )}
      </section>

      <form className="card stack" onSubmit={submit}>
        <h2>2. Check the fields and submit</h2>
        <div className="grid-2">
          <div className="field"><label htmlFor="company">Company (required)</label><input id="company" type="text" required maxLength={120} value={form.company} onChange={set("company")} /></div>
          <div className="field"><label htmlFor="city">City in India (required)</label><input id="city" type="text" required maxLength={60} value={form.city} onChange={set("city")} /></div>
          <div className="field"><label htmlFor="provider">Provider named in the source</label><input id="provider" type="text" maxLength={120} value={form.provider} onChange={set("provider")} /></div>
          <div className="field"><label htmlFor="role">Provider&apos;s role</label><select id="role" value={form.role} onChange={set("role")}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        </div>
        <div className="field"><label htmlFor="sourceUrl">Link to the source (required)</label><input id="sourceUrl" type="url" required maxLength={500} placeholder="https://" value={form.sourceUrl} onChange={set("sourceUrl")} /></div>
        <div className="field"><label htmlFor="note">What the source says, in one sentence</label><textarea id="note" maxLength={500} style={{ minHeight: 72 }} value={form.note} onChange={set("note")} /></div>
        <div aria-live="polite">{message && <p className={message.kind}>{message.text}</p>}</div>
        <div><button className="btn" type="submit" disabled={busy !== ""}>{busy === "submit" ? "Submitting…" : "Submit for review"}</button></div>
      </form>

      <section className="stack">
        <h2>Review queue</h2>
        {queue.length === 0 ? (
          <p className="card muted">Nothing is waiting. Submissions appear here until a reviewer checks the source.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Company</th><th>City</th><th>Provider</th><th>Source</th><th>State</th></tr></thead>
              <tbody>
                {queue.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.company}</b>{s.note && <div className="muted small">{s.note}</div>}</td>
                    <td data-label="City">{s.city}</td>
                    <td data-label="Provider">{s.provider || <span className="muted">None named</span>}</td>
                    <td data-label="Source"><a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">Open</a></td>
                    <td><span className="tag">Waiting for review</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small">In this prototype the queue lives in the server&apos;s memory and clears when the server restarts.</p>
      </section>
    </div>
  );
}
