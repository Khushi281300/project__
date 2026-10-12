"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { calculateSimulation, type OperatingModel, type SimulatorInput } from "@/lib/domain/simulator";
import type { BlueprintPlan } from "@/lib/services/planGenerator";

const SECTORS = [
  "Enterprise SaaS",
  "FinTech & Banking",
  "Life Sciences & HealthTech",
  "Retail & E-Commerce",
  "Automotive & Industrial IoT",
  "Telecom & Media",
  "Other",
];

const CITIES = [
  { value: "auto", label: "Auto-Recommend (Optimal Cluster)" },
  { value: "Bengaluru", label: "Bengaluru (Karnataka)" },
  { value: "Hyderabad", label: "Hyderabad (Telangana)" },
  { value: "Pune", label: "Pune (Maharashtra)" },
  { value: "Chennai", label: "Chennai (Tamil Nadu)" },
  { value: "Delhi NCR", label: "Delhi NCR (Gurugram / Noida)" },
  { value: "Coimbatore", label: "Coimbatore (Tier 2 Hub)" },
  { value: "Ahmedabad / GIFT City", label: "GIFT City (IFSC Gujarat)" },
];

export default function PlanClient({ initialAi }: { initialAi: boolean }) {
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("Enterprise SaaS");
  const [headcount, setHeadcount] = useState(100);
  const [city, setCity] = useState("auto");
  const [operatingModel, setOperatingModel] = useState<OperatingModel>("captive");
  const [engMix, setEngMix] = useState(55);
  const [aiMix, setAiMix] = useState(25);
  const [activeTab, setActiveTab] = useState<"cost" | "location" | "roadmap" | "blueprint">("cost");

  // Blueprint state
  const [generating, setGenerating] = useState(false);
  const [blueprint, setBlueprint] = useState<BlueprintPlan | null>(null);
  const [blueprintError, setBlueprintError] = useState<string | null>(null);

  // Live simulation calculated synchronously without lag
  const sim = useMemo(() => {
    const input: SimulatorInput = {
      companyName,
      sector,
      headcount,
      city,
      operatingModel,
      functionMix: {
        engineering: engMix,
        aiData: aiMix,
        cloudSecOps: 10,
        operations: Math.max(0, 100 - (engMix + aiMix + 10)),
      },
    };
    return calculateSimulation(input);
  }, [companyName, sector, headcount, city, operatingModel, engMix, aiMix]);

  const handleGenerateBlueprint = async () => {
    setGenerating(true);
    setBlueprintError(null);
    setActiveTab("blueprint");
    try {
      const res = await fetch("/api/v1/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          sector,
          headcount,
          city,
          operatingModel,
          functionMix: {
            engineering: engMix,
            aiData: aiMix,
            cloudSecOps: 10,
            operations: Math.max(0, 100 - (engMix + aiMix + 10)),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Generation failed");
      setBlueprint(data.data as BlueprintPlan);
    } catch (err) {
      setBlueprintError(err instanceof Error ? err.message : "Failed to generate blueprint");
    } finally {
      setGenerating(false);
    }
  };

  // Turn [slug] references in text into interactive links
  const renderCitations = (text: string) => {
    const parts = text.split(/(\[[a-z0-9-]+\])/g);
    return parts.map((part, idx) => {
      const match = part.match(/^\[([a-z0-9-]+)\]$/);
      if (match) {
        return (
          <Link key={idx} href={`/gcc/${match[1]}`} className="name" style={{ fontWeight: 600, textDecoration: "underline" }}>
            {match[1]}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <div className="stack-lg">
      <div className="planner-grid">
        {/* Left Column: Interactive Setup Inputs */}
        <div className="card stack">
          <h2>Configure Your India GCC Strategy</h2>
          <p className="small muted">
            Model real-time budget, headcount ramp, real estate, and state subsidies benchmarked against verified ledger records.
          </p>

          <div className="field">
            <label htmlFor="comp">Company / Parent Name (Optional)</label>
            <input
              id="comp"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Cloud Corp"
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="sec">Industry / Domain</label>
              <select id="sec" value={sector} onChange={(e) => setSector(e.target.value)}>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="loc">Location Preference</label>
              <select id="loc" value={city} onChange={(e) => setCity(e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Slider: Headcount */}
          <div className="slider-group">
            <div className="slider-header">
              <label htmlFor="headcount">Planned Year-1 Headcount</label>
              <span className="slider-val">{headcount} specialists</span>
            </div>
            <input
              id="headcount"
              type="range"
              min="15"
              max="600"
              step="5"
              value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value))}
            />
            <div className="chips">
              {[25, 50, 100, 200, 350].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`chip ${headcount === count ? "active" : ""}`}
                  onClick={() => setHeadcount(count)}
                >
                  {count} seats
                </button>
              ))}
            </div>
          </div>

          {/* Operating Model Selector */}
          <div className="field">
            <label>Operating & Governance Model</label>
            <div className="model-toggle">
              <button
                type="button"
                className={`model-btn ${operatingModel === "captive" ? "active" : ""}`}
                onClick={() => setOperatingModel("captive")}
              >
                <b>Direct Captive</b>
                <span>100% legal entity & IP custody from Day 1</span>
              </button>
              <button
                type="button"
                className={`model-btn ${operatingModel === "bot" ? "active" : ""}`}
                onClick={() => setOperatingModel("bot")}
              >
                <b>Turnkey BOT</b>
                <span>Partner builds & transfers after 2-3 yrs</span>
              </button>
              <button
                type="button"
                className={`model-btn ${operatingModel === "eor" ? "active" : ""}`}
                onClick={() => setOperatingModel("eor")}
              >
                <b>EOR / Incubator</b>
                <span>Flexiple talent model; launch in 3 wks</span>
              </button>
            </div>
          </div>

          {/* Talent Mix */}
          <div className="grid-2">
            <div className="slider-group">
              <div className="slider-header">
                <label htmlFor="eng-mix" className="small">Core Software & Cloud</label>
                <span className="num">{engMix}%</span>
              </div>
              <input
                id="eng-mix"
                type="range"
                min="20"
                max="80"
                value={engMix}
                onChange={(e) => setEngMix(Number(e.target.value))}
              />
            </div>
            <div className="slider-group">
              <div className="slider-header">
                <label htmlFor="ai-mix" className="small">AI / ML & DeepTech</label>
                <span className="num">{aiMix}%</span>
              </div>
              <input
                id="ai-mix"
                type="range"
                min="5"
                max="60"
                value={aiMix}
                onChange={(e) => setAiMix(Number(e.target.value))}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn"
            style={{ width: "100%", marginTop: 8 }}
            onClick={handleGenerateBlueprint}
            disabled={generating}
          >
            {generating ? "Synthesizing Strategy..." : "Generate Strategic AI Blueprint"}
          </button>
        </div>

        {/* Right Column: Live Calculated Output */}
        <div className="stack">
          {/* Headline Metric Card */}
          <div className="metric-hero">
            <div className="row between">
              <span className="eyebrow" style={{ color: "#fdba8c" }}>
                Target: {sim.selectedCity} {sim.isAutoRecommended && "(Optimal Match)"}
              </span>
              <div className="savings-badge">
                <b>{sim.cost.savingsPercentage}% Cost Arbitrage vs US</b>
              </div>
            </div>

            <div>
              <span style={{ fontSize: "0.85rem", color: "#aab5ca", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Estimated Annual India Run-Rate
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4 }}>
                <b style={{ fontFamily: "var(--serif)", fontSize: "2.6rem", color: "#fff", lineHeight: 1 }}>
                  ${(sim.cost.totalAnnualRunRateUsd / 1_000_000).toFixed(2)}M
                </b>
                <span style={{ color: "#fdba8c", fontSize: "1.1rem" }}>
                  (₹{sim.cost.totalAnnualRunRateInr.toFixed(1)} Cr/yr)
                </span>
              </div>
              <p className="small" style={{ color: "#aab5ca", marginTop: 4 }}>
                US equivalent: ${(sim.cost.usEquivalentUsd / 1_000_000).toFixed(1)}M/yr. Net annual savings:{" "}
                <strong style={{ color: "#7ce8d3" }}>${(sim.cost.netSavingsUsd / 1_000_000).toFixed(2)}M</strong>.
              </p>
            </div>

            <div className="metric-row">
              <div className="metric-sub">
                <b>${(sim.cost.talentAnnualUsd / 1_000_000).toFixed(2)}M</b>
                <span>Loaded Talent & Payroll</span>
              </div>
              <div className="metric-sub">
                <b>${(sim.cost.realEstateAnnualUsd / 1_000_000).toFixed(2)}M</b>
                <span>Grade-A Facilities</span>
              </div>
              <div className="metric-sub">
                <b>-${(sim.cost.stateIncentiveSavingsUsd / 1_000_000).toFixed(2)}M</b>
                <span>Estimated Subsidies</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Granular Analysis */}
          <div className="tab-nav">
            <button
              type="button"
              className={`tab-btn ${activeTab === "cost" ? "active" : ""}`}
              onClick={() => setActiveTab("cost")}
            >
              Cost Breakdown
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "location" ? "active" : ""}`}
              onClick={() => setActiveTab("location")}
            >
              City Ranking
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "roadmap" ? "active" : ""}`}
              onClick={() => setActiveTab("roadmap")}
            >
              Roadmap
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "blueprint" ? "active" : ""}`}
              onClick={() => setActiveTab("blueprint")}
            >
              AI Blueprint {blueprint && "✓"}
            </button>
          </div>

          {/* Tab 1: Cost Details */}
          {activeTab === "cost" && (
            <div className="card stack">
              <h3>Year-1 Operating Budget Breakdown</h3>
              <dl className="facts">
                <dt>Talent Payroll</dt>
                <dd>
                  <b>${(sim.cost.talentAnnualUsd / 1_000_000).toFixed(2)}M</b> (₹{sim.cost.talentAnnualInr.toFixed(2)} Cr)
                  <p className="small muted">Includes PF, gratuity, comprehensive healthcare, and local bonus provisions.</p>
                </dd>
                <dt>Office Lease & Opex</dt>
                <dd>
                  <b>${(sim.cost.realEstateAnnualUsd / 1_000_000).toFixed(2)}M</b> (₹{sim.cost.realEstateAnnualInr.toFixed(2)} Cr)
                  <p className="small muted">~{headcount * 110} sq ft @ ₹{(sim.cost.realEstateAnnualInr * 10_000_000 / (headcount * 110 * 12)).toFixed(0)}/sq ft/mo blended rent & maintenance.</p>
                </dd>
                <dt>Upfront Setup / Capex</dt>
                <dd>
                  <b>${(sim.cost.operationalCapexUsd / 1_000_000).toFixed(2)}M</b> (₹{sim.cost.operationalCapexInr.toFixed(2)} Cr)
                  <p className="small muted">{sim.operatingModelDetails.upfrontCapexSummary}.</p>
                </dd>
                <dt>State Policy Rebates</dt>
                <dd style={{ color: "var(--verified)" }}>
                  <b>-${(sim.cost.stateIncentiveSavingsUsd / 1_000_000).toFixed(2)}M</b> (₹{sim.cost.stateIncentiveSavingsInr.toFixed(2)} Cr saved)
                  <p className="small muted">Based on applicable state IT/GCC policies (lease rental waivers, stamp duty rebates).</p>
                </dd>
              </dl>
            </div>
          )}

          {/* Tab 2: Location Rankings */}
          {activeTab === "location" && (
            <div className="card stack">
              <h3>Comparative City Suitability Matrix</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>City</th><th>Score</th><th>Avg Grade-A Rent</th><th>Talent Multiplier</th></tr>
                  </thead>
                  <tbody>
                    {sim.cityRankings.map((c) => (
                      <tr key={c.city} style={{ background: c.city === sim.selectedCity ? "#fff8e6" : undefined }}>
                        <td>
                          <b>{c.city}</b>
                          <div className="muted small">{c.reasons[0]}</div>
                        </td>
                        <td><span className="pill">{c.score}/100</span></td>
                        <td className="num">₹{c.avgRent}/sq ft</td>
                        <td className="num">{c.talentFactor}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Roadmap */}
          {activeTab === "roadmap" && (
            <div className="card stack">
              <h3>Implementation Roadmap ({sim.operatingModelDetails.title})</h3>
              <p className="small muted">Estimated time to first productive engineering commit: <b>{sim.operatingModelDetails.timeToFirstHire}</b>.</p>
              <ul className="timeline">
                {sim.roadmapPhases.map((r) => (
                  <li key={r.phase} className="timeline-item">
                    <span className="timeline-window">{r.window}</span>
                    <div className="timeline-body">
                      <b>{r.phase}</b>
                      <p>{r.deliverable}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tab 4: AI Blueprint */}
          {activeTab === "blueprint" && (
            <div className="card stack">
              <div className="row between">
                <h3>Executive Strategy Synthesis</h3>
                {blueprint && <span className="tag">{blueprint.mode === "ai" ? "AI Generated" : "Rule Engine Verified"}</span>}
              </div>

              {blueprintError && <p className="error">{blueprintError}</p>}

              {generating && (
                <div style={{ padding: "30px 0", textAlign: "center" }}>
                  <p className="muted">Analyzing {sim.headcount}-person blueprint for {sim.selectedCity} using verified ledger records...</p>
                </div>
              )}

              {!generating && blueprint && (
                <div className="stack">
                  <div className="answer prose" style={{ fontSize: "0.95rem" }}>
                    {renderCitations(blueprint.synthesis)}
                  </div>

                  {blueprint.peerGccs.length > 0 && (
                    <div className="stack" style={{ marginTop: 12 }}>
                      <p className="eyebrow">Peer GCCs on Record</p>
                      <div className="grid-2">
                        {blueprint.peerGccs.map((peer) => (
                          <div key={peer.slug} className="card stack" style={{ padding: 14 }}>
                            <div className="row between">
                              <Link href={`/gcc/${peer.slug}`} className="name"><b>{peer.company}</b></Link>
                              <span className={`badge ${peer.verification}`}>{peer.verification}</span>
                            </div>
                            <span className="muted small">{peer.city} · {peer.sector}</span>
                            <span className="small">Providers: {peer.providers}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {blueprint.recommendedProviders.length > 0 && (
                    <div className="stack" style={{ marginTop: 12 }}>
                      <p className="eyebrow">Vetted Service Providers on Record</p>
                      <div className="grid-3">
                        {blueprint.recommendedProviders.map((prov) => (
                          <Link key={prov.slug} href={`/providers/${prov.slug}`} className="card stack" style={{ padding: 14, textDecoration: "none", color: "inherit" }}>
                            <b>{prov.name}</b>
                            <span className="muted small">{prov.type}</span>
                            <span className="num" style={{ color: "var(--verified)" }}>{prov.verifiedLinks} verified links</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!generating && !blueprint && (
                <div className="empty">
                  <p>Click <b>&quot;Generate Strategic AI Blueprint&quot;</b> to assemble a tailored expansion blueprint with citations to verified GCCs.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
