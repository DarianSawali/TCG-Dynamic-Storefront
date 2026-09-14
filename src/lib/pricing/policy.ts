export const DEFAULT_PRICE_POLICY = {
  maxMarketAgeMs: 24 * 60 * 60 * 1000,
  automaticUpdateCooldownMs: 24 * 60 * 60 * 1000,
  largeDecreaseConfirmationMs: 6 * 60 * 60 * 1000,
  largeDecreaseConfirmationMaxAgeMs: 24 * 60 * 60 * 1000,
  automaticIncreaseLimit: 0.25,
  largeDecreasePercent: 0.1,
  largeDecreaseMinimumCents: 200,
} as const;

export type PriceDecision =
  | "auto-update"
  | "approval-required"
  | "awaiting-confirmation"
  | "no-change"
  | "skipped";

export type PriceEvaluation = {
  decision: PriceDecision;
  reason: string;
  changeCents: number;
  changePercent: number;
};

export type PricePolicyInput = {
  currentPriceCents: number;
  targetPriceCents: number | null;
  marketFetchedAt: Date | null;
  now?: Date;
  lastAutomaticUpdateAt?: Date | null;
  previousLargeDecreaseAt?: Date | null;
  manualLockUntil?: Date | null;
};

export type HistoricalPriceObservation = {
  amountCents: number;
  fetchedAt: Date;
};

export function previousLargeDecreaseAt(
  currentPriceCents: number,
  observation: HistoricalPriceObservation | null | undefined,
  now: Date,
): Date | null {
  if (!observation) return null;
  const historicalDecision = evaluatePriceChange({
    currentPriceCents,
    targetPriceCents: observation.amountCents,
    marketFetchedAt: observation.fetchedAt,
    now,
  });
  return historicalDecision.decision === "awaiting-confirmation"
    ? observation.fetchedAt
    : null;
}

export function evaluatePriceChange(input: PricePolicyInput): PriceEvaluation {
  const now = input.now ?? new Date();
  const target = input.targetPriceCents;

  if (!Number.isInteger(input.currentPriceCents) || input.currentPriceCents <= 0) {
    return skipped("The current Shopify price is invalid.");
  }
  if (target == null || !Number.isInteger(target) || target <= 0) {
    return skipped("No valid live market price is available.");
  }
  if (!input.marketFetchedAt) {
    return skipped("The market price has no retrieval timestamp.");
  }

  const marketAge = now.getTime() - input.marketFetchedAt.getTime();
  if (marketAge < 0 || marketAge > DEFAULT_PRICE_POLICY.maxMarketAgeMs) {
    return skipped("The market price is stale or has an invalid timestamp.");
  }
  if (input.manualLockUntil && input.manualLockUntil > now) {
    return skipped("This variant is temporarily locked after a manual change.");
  }
  if (
    input.lastAutomaticUpdateAt &&
    now.getTime() - input.lastAutomaticUpdateAt.getTime() <
      DEFAULT_PRICE_POLICY.automaticUpdateCooldownMs
  ) {
    return skipped("This variant is inside the 24-hour automatic-update cooldown.");
  }

  const changeCents = target - input.currentPriceCents;
  const changePercent = changeCents / input.currentPriceCents;
  const result = (decision: PriceDecision, reason: string): PriceEvaluation => ({
    decision,
    reason,
    changeCents,
    changePercent,
  });

  if (changeCents === 0) return result("no-change", "Shopify already has the target price.");

  if (changeCents > 0) {
    if (changePercent <= DEFAULT_PRICE_POLICY.automaticIncreaseLimit) {
      return result("auto-update", "Increase is within the 25% automatic limit.");
    }
    return result("approval-required", "Increase exceeds the 25% safety limit.");
  }

  const decreaseCents = Math.abs(changeCents);
  const decreasePercent = Math.abs(changePercent);
  const isLargeDecrease =
    decreasePercent > DEFAULT_PRICE_POLICY.largeDecreasePercent &&
    decreaseCents >= DEFAULT_PRICE_POLICY.largeDecreaseMinimumCents;

  if (!isLargeDecrease) {
    return result("auto-update", "Decrease is below the large-drop thresholds.");
  }

  if (!input.previousLargeDecreaseAt) {
    return result(
      "awaiting-confirmation",
      "Large decrease must appear in a second check at least 6 hours later.",
    );
  }

  const confirmationAge = now.getTime() - input.previousLargeDecreaseAt.getTime();
  if (confirmationAge < DEFAULT_PRICE_POLICY.largeDecreaseConfirmationMs) {
    return result("awaiting-confirmation", "The confirmation check is not yet 6 hours old.");
  }
  if (confirmationAge > DEFAULT_PRICE_POLICY.largeDecreaseConfirmationMaxAgeMs) {
    return result("awaiting-confirmation", "The previous low-price observation has expired.");
  }

  return result("approval-required", "Large decrease was confirmed by two timed checks.");
}

function skipped(reason: string): PriceEvaluation {
  return { decision: "skipped", reason, changeCents: 0, changePercent: 0 };
}
