import assert from "node:assert/strict";
import { test } from "node:test";
import { assess, publisherKey } from "../lib/domain/verification.ts";

test("company confirmation verifies on its own", () => {
  assert.equal(assess([{ publisher: "Carlsberg Group", origin: "company" }]).verification, "verified");
});

test("two independent publishers verify", () => {
  const r = assess([{ publisher: "Industrial Distribution", origin: "independent" }, { publisher: "Modern Distribution Management", origin: "independent" }]);
  assert.equal(r.verification, "verified");
});

test("the same wire story on two sites counts once", () => {
  const r = assess([{ publisher: "PTI (via The Week)", origin: "independent" }, { publisher: "Outlook Business (PTI)", origin: "independent" }]);
  assert.equal(r.verification, "claimed");
  assert.equal(publisherKey("Reuters (via MarketScreener)"), "reuters");
});

test("a provider's own page never verifies its claim", () => {
  const r = assess([{ publisher: "ANSR", origin: "provider" }]);
  assert.deepEqual(r, { verification: "claimed", reason: "The provider's own claim only" });
});

test("one independent source plus the provider's page stays claimed", () => {
  const r = assess([{ publisher: "Investment Monitor", origin: "independent" }, { publisher: "ANSR", origin: "provider" }]);
  assert.equal(r.verification, "claimed");
});
