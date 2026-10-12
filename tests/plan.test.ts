import assert from "node:assert/strict";
import { test } from "node:test";
import { composeAnswer, planQuestion, type PlanRecord, type Vocab } from "../lib/domain/plan.ts";

const vocab: Vocab = {
  cities: ["Bengaluru", "Hyderabad", "Pune", "Coimbatore", "Kochi", "Gurugram"],
  sectors: ["BFSI", "Retail and Consumer", "Technology"],
  providers: [{ name: "ANSR", slug: "ansr" }, { name: "EY", slug: "ey" }],
  companies: ["T-Mobile", "Walmart Global Tech", "L'Oréal", "Wells Fargo"],
};

test("recognises city, sector and provider words", () => {
  const p = planQuestion("Which retail companies opened a centre in Bangalore?", vocab);
  assert.deepEqual(p.cities, ["Bengaluru"]);
  assert.equal(p.sector, "Retail and Consumer");
  assert.equal(planQuestion("who did ANSR work with?", vocab).providers[0], "ansr");
});

test("matches a company despite apostrophes and accents", () => {
  assert.deepEqual(planQuestion("What do we know about T-Mobile's centre?", vocab).companies, ["T-Mobile"]);
  assert.deepEqual(planQuestion("tell me about L'Oreal", vocab).companies, ["L'Oréal"]);
  assert.deepEqual(planQuestion("is Walmart in the ledger", vocab).companies, ["Walmart Global Tech"]);
});

test("'outside the big metros' excludes the metros", () => {
  const p = planQuestion("Which centres are outside the big metros?", vocab);
  assert.ok(p.notCities.includes("Hyderabad") && !p.notCities.includes("Coimbatore"));
  assert.ok(p.recognised);
});

test("reads status and verification words", () => {
  const p = planQuestion("verified announced centres", vocab);
  assert.equal(p.verification, "verified");
  assert.equal(p.status, "announced");
});

test("a question with no known term is not recognised", () => {
  assert.equal(planQuestion("tell me a joke", vocab).recognised, false);
});

const rec = (o: Partial<PlanRecord>): PlanRecord => ({ slug: "x", company: "X", city: "Pune", status: "operational", opened: "2026", verification: "verified", reason: "2 independent publishers agree", caveat: "", linkSummary: "", ...o });

test("an answer cites each record and keeps claimed as claimed", () => {
  const plan = planQuestion("Which providers set up centres in Hyderabad?", vocab);
  const a = composeAnswer(plan, [rec({ slug: "a-hyd", linkSummary: "ANSR (setup, claimed)" }), rec({ slug: "b-hyd", linkSummary: "ANSR (setup, verified)" })], 2);
  assert.match(a, /ANSR: 1 verified, 1 claimed/);
  assert.match(a, /\[a-hyd\]/);
});

test("an empty result says so and does not claim absence from the market", () => {
  const a = composeAnswer(planQuestion("banks in Kochi", vocab), [], 0);
  assert.match(a, /not that none exists/);
});

test("'verified' in a provider question means the link, not the centre", () => {
  const p = planQuestion("Which providers have a verified set-up in Hyderabad?", vocab);
  assert.equal(p.verification, "");
  assert.equal(p.linkVerification, "verified");
  const a = composeAnswer(p, [rec({ slug: "a-hyd", linkSummary: "ANSR (setup, claimed)" }), rec({ slug: "b-hyd", linkSummary: "EY (advisory, verified)" })], 2);
  assert.match(a, /EY: 1 verified \[b-hyd\]/);
  assert.doesNotMatch(a, /ANSR/);
});
