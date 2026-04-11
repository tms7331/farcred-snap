// src/payout.ts
import type { Side } from "./types.js";

/**
 * Calculate payouts for a resolved market.
 * Winners get their bet back + proportional share of the losing pool.
 * Returns a map of fid -> payout amount.
 */
export function calculatePayouts(
  bets: Map<number, { side: Side; amount: number }>,
  outcome: Side,
): Map<number, number> {
  const payouts = new Map<number, number>();

  let winningTotal = 0;
  let losingTotal = 0;

  for (const [, bet] of bets) {
    if (bet.side === outcome) {
      winningTotal += bet.amount;
    } else {
      losingTotal += bet.amount;
    }
  }

  for (const [fid, bet] of bets) {
    if (bet.side === outcome) {
      const share = bet.amount / winningTotal;
      const payout = bet.amount + Math.floor(losingTotal * share);
      payouts.set(fid, payout);
    }
  }

  return payouts;
}
