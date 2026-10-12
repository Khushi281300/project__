import type { Metadata } from "next";
import AskClient from "./AskClient";

export const metadata: Metadata = { title: "Ask" };

export default function AskPage() {
  return (
    <div className="stack-lg">
      <section className="hero">
        <p className="eyebrow">Ask the ledger</p>
        <h1>A plain-English question, a sourced answer</h1>
        <p>The answer is written only from ledger records and names each one it used. If the records do not cover your question, it says so.</p>
      </section>
      <AskClient />
    </div>
  );
}
