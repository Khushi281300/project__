import type { Metadata } from "next";
import { aiConfigured } from "@/lib/llm/anthropic";
import PlanClient from "./PlanClient";

export const metadata: Metadata = {
  title: "Setup Planner & Feasibility",
  description: "Interactive GCC Setup Feasibility Copilot. Calculate cost arbitrage, compare city talent clusters, and generate a strategic blueprint.",
};

export default function PlanPage() {
  return (
    <div className="stack-lg">
      <section className="hero">
        <p className="eyebrow">Strategy & Feasibility Copilot</p>
        <h1>Plan your India GCC entry with verified data</h1>
        <p>
          Simulate budget, headcount ramp, real estate, and state subsidies. Synthesize an evidence-backed
          blueprint with peer citations from the ledger.
        </p>
      </section>
      <PlanClient initialAi={aiConfigured()} />
    </div>
  );
}
