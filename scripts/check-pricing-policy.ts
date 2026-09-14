import assert from "node:assert/strict";
import {
  evaluatePriceChange,
  previousLargeDecreaseAt,
} from "../src/lib/pricing/policy";

const now = new Date("2026-09-08T18:00:00.000Z");
const fresh = new Date("2026-09-08T17:00:00.000Z");
const evaluate = (targetPriceCents: number, extra = {}) =>
  evaluatePriceChange({
    currentPriceCents: 10_00,
    targetPriceCents,
    marketFetchedAt: fresh,
    now,
    ...extra,
  }).decision;

assert.equal(evaluate(11_00), "auto-update");
assert.equal(evaluate(13_00), "approval-required");
assert.equal(evaluate(9_50), "auto-update");
assert.equal(evaluate(7_50), "awaiting-confirmation");
assert.equal(
  evaluate(7_50, { previousLargeDecreaseAt: new Date("2026-09-08T11:00:00.000Z") }),
  "approval-required",
);
assert.equal(
  evaluatePriceChange({
    currentPriceCents: 10_00,
    targetPriceCents: 11_00,
    marketFetchedAt: new Date("2026-09-07T12:00:00.000Z"),
    now,
  }).decision,
  "skipped",
);
assert.equal(
  previousLargeDecreaseAt(
    10_00,
    { amountCents: 7_50, fetchedAt: new Date("2026-09-08T11:00:00.000Z") },
    now,
  )?.toISOString(),
  "2026-09-08T11:00:00.000Z",
);
assert.equal(
  previousLargeDecreaseAt(
    10_00,
    { amountCents: 9_50, fetchedAt: new Date("2026-09-08T11:00:00.000Z") },
    now,
  ),
  null,
);

console.log("Pricing policy checks passed.");
