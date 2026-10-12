import Link from "next/link";

export default function NotFound() {
  return (
    <div className="stack">
      <h1>That page is not in the ledger</h1>
      <p className="muted">The link may be old, or the record may have been merged into another.</p>
      <p><Link className="btn" href="/">Back to all records</Link></p>
    </div>
  );
}
