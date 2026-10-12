import type { Metadata } from "next";
import { connection } from "next/server";
import { aiConfigured } from "@/lib/llm/anthropic";
import SubmitClient from "./SubmitClient";

export const metadata: Metadata = { title: "Submit evidence" };

export default async function SubmitPage() {
  await connection(); // read the AI switch at request time, not at build time
  return (
    <div className="stack-lg">
      <section className="hero">
        <p className="eyebrow">Submit evidence</p>
        <h1>Add a record, or back a claim with a source</h1>
        <p>Anyone can propose a GCC or a provider link. A source link is required, a person reviews it, and nobody can pay to change a status.</p>
      </section>
      <SubmitClient aiOn={aiConfigured()} />
    </div>
  );
}
