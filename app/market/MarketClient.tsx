"use client";

import { useState } from "react";
import { CITY_BENCHMARKS, POLICIES, type CityBenchmark, type Policy } from "@/data/market";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function MarketClient() {
  const [selectedTier, setSelectedTier] = useState<"All" | "Tier 1" | "Tier 2">("All");
  const [activeCity, setActiveCity] = useState<string>("Bengaluru");
  const [policyFilter, setPolicyFilter] = useState<string>("All");

  const filteredCities = CITY_BENCHMARKS.filter(
    (c) => selectedTier === "All" || c.tier === selectedTier
  );

  const activeBenchmark = CITY_BENCHMARKS.find((c) => c.city === activeCity) || CITY_BENCHMARKS[0];

  const filteredPolicies = POLICIES.filter(
    (p) => policyFilter === "All" || p.state === policyFilter
  );

  return (
    <div className="stack-lg">
      {/* Interactive City Benchmarks Section */}
      <section className="stack" aria-label="City Benchmarks and Talent Cost">
        <div className="row between">
          <div>
            <h2>City Benchmark & Talent Cost Matrix</h2>
            <p className="small muted">
              Comparing Grade-A office leasing, salary bands, and talent concentration across India&apos;s primary and emerging GCC hubs.
            </p>
          </div>
          <div className="chips">
            {(["All", "Tier 1", "Tier 2"] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                className={`chip ${selectedTier === tier ? "active" : ""}`}
                onClick={() => setSelectedTier(tier)}
              >
                {tier === "All" ? "All Hubs" : `${tier} Hubs`}
              </button>
            ))}
          </div>
        </div>

        {/* City Selector Cards */}
        <div className="grid-3">
          {filteredCities.map((b) => (
            <div
              key={b.city}
              className={`card stack ${activeCity === b.city ? "callout" : ""}`}
              style={{ cursor: "pointer", padding: 18 }}
              onClick={() => setActiveCity(b.city)}
            >
              <div className="row between">
                <h3>{b.city}</h3>
                <span className="tag">{b.tier}</span>
              </div>
              <div className="row between" style={{ alignItems: "baseline" }}>
                <span className="num" style={{ fontWeight: 600, color: "var(--accent-ink)" }}>
                  ₹{b.gradeARent.avg}/sq ft/mo
                </span>
                <span className="small muted">{b.share}</span>
              </div>
              <p className="small muted" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {b.keyStrengths}
              </p>
            </div>
          ))}
        </div>

        {/* Selected City Deep-Dive Card */}
        <div className="card stack" style={{ background: "#fffdf9", borderColor: "var(--accent)" }}>
          <div className="row between">
            <div>
              <span className="eyebrow">{activeBenchmark.state}</span>
              <h2 style={{ fontSize: "1.7rem" }}>{activeBenchmark.city} Hub Intelligence</h2>
            </div>
            <span className="tag" style={{ fontSize: "0.85rem", padding: "4px 10px" }}>
              Talent Cost Multiplier: {activeBenchmark.talentCostMultiplier}x vs BLR
            </span>
          </div>

          <div className="grid-2" style={{ marginTop: 8 }}>
            <div className="stack">
              <h4>Representative Tech Salary Bands (Annual)</h4>
              <dl className="facts">
                <dt>Mid SDE (3-5 yrs)</dt>
                <dd><b>{activeBenchmark.medianSalary.midEngineer}</b></dd>
                <dt>Staff / Tech Lead</dt>
                <dd><b>{activeBenchmark.medianSalary.staffLead}</b></dd>
                <dt>Director / Head of Eng</dt>
                <dd><b>{activeBenchmark.medianSalary.director}</b></dd>
              </dl>
            </div>

            <div className="stack">
              <h4>Commercial Real Estate & Clustering</h4>
              <dl className="facts">
                <dt>Grade-A Rent Range</dt>
                <dd><b>₹{activeBenchmark.gradeARent.min} - ₹{activeBenchmark.gradeARent.max}</b> /sq ft/month (Avg: ₹{activeBenchmark.gradeARent.avg})</dd>
                <dt>Primary Sectors</dt>
                <dd>{activeBenchmark.topSectors.join(", ")}</dd>
                <dt>Key Advantage</dt>
                <dd>{activeBenchmark.keyStrengths}</dd>
              </dl>
            </div>
          </div>

          <div style={{ background: "#f8f5ee", padding: 14, borderRadius: 10, marginTop: 8 }}>
            <b style={{ fontSize: "0.85rem", color: "var(--ink)", display: "block", marginBottom: 4 }}>
              State Incentive Highlight:
            </b>
            <p className="small muted">{activeBenchmark.incentiveHighlights}</p>
          </div>
        </div>
      </section>

      {/* State Policy Matrix */}
      <section className="stack" aria-label="State GCC Policies">
        <div className="row between">
          <div>
            <h2>What States Offer: Comprehensive Policy Terms</h2>
            <p className="small muted">
              Verified statutory provisions across active state GCC policies, from capex grants to power tariff waivers.
            </p>
          </div>
          <div className="chips">
            {["All", ...POLICIES.map((p) => p.state)].map((st) => (
              <button
                key={st}
                type="button"
                className={`chip ${policyFilter === st ? "active" : ""}`}
                onClick={() => setPolicyFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-2">
          {filteredPolicies.map((p) => (
            <div key={p.state} className="card stack">
              <div className="row between">
                <h3>{p.state}</h3>
                <span className="tag">{p.name}</span>
              </div>
              <p><b>Target:</b> {p.aim}.</p>
              {p.hook && <p className="muted small">{p.hook}.</p>}

              <dl className="facts" style={{ marginTop: 8 }}>
                <dt>Capital Subsidy</dt>
                <dd className="small">{p.capitalSubsidy}</dd>
                <dt>Lease Rental Support</dt>
                <dd className="small">{p.leaseSupport}</dd>
                <dt>Tax & Power Waivers</dt>
                <dd className="small">{p.taxTariff}</dd>
                <dt>Eligibility Criteria</dt>
                <dd className="small">{p.minJobs}</dd>
              </dl>

              <div style={{ marginTop: 8 }}>
                <a className="small" href={p.url} {...ext}>Read the official gazette / source</a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
