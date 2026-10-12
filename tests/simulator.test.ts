import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateSimulation } from "../lib/domain/simulator.ts";

test("calculates realistic cost arbitrage and savings percentage for 100 people in Bengaluru", () => {
  const result = calculateSimulation({
    sector: "Enterprise SaaS",
    headcount: 100,
    city: "Bengaluru",
    operatingModel: "captive",
  });

  assert.equal(result.selectedCity, "Bengaluru");
  assert.equal(result.headcount, 100);
  assert.equal(result.operatingModel, "captive");
  // Total run rate in USD should be between $3M and $6M for 100 engineers
  assert.ok(result.cost.totalAnnualRunRateUsd > 2_500_000, "run rate should be > $2.5M");
  assert.ok(result.cost.totalAnnualRunRateUsd < 7_000_000, "run rate should be < $7M");
  // Arbitrage vs US ($19.5M for 100 devs) should yield 65% - 85% savings
  assert.ok(result.cost.savingsPercentage >= 65 && result.cost.savingsPercentage <= 85, "savings percentage in reasonable range");
  assert.ok(result.cost.netSavingsUsd > 10_000_000, "net savings should exceed $10M");
});

test("auto-recommends a city based on sector and scale", () => {
  const finResult = calculateSimulation({
    sector: "FinTech",
    headcount: 80,
    city: "auto",
    operatingModel: "bot",
  });

  assert.ok(finResult.isAutoRecommended);
  assert.ok(finResult.cityRankings.length >= 5);
  assert.ok(finResult.cityRankings[0].score >= 80);
});

test("operating model changes affect capex and time to hire", () => {
  const captive = calculateSimulation({ sector: "Health", headcount: 50, city: "Pune", operatingModel: "captive" });
  const eor = calculateSimulation({ sector: "Health", headcount: 50, city: "Pune", operatingModel: "eor" });

  assert.ok(captive.cost.operationalCapexUsd > eor.cost.operationalCapexUsd, "captive upfront capex is higher than EOR");
  assert.equal(captive.operatingModelDetails.timeToFirstHire, "4 to 6 months");
  assert.equal(eor.operatingModelDetails.timeToFirstHire, "2 to 4 weeks");
});
