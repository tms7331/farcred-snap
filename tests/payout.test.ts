import { describe, it, expect } from "vitest";
import { calculatePayouts } from "../src/payout.js";

describe("calculatePayouts", () => {
  it("distributes losing pool proportionally to winners", () => {
    const bets = new Map<number, { side: "yes" | "no"; amount: number }>();
    bets.set(1, { side: "yes", amount: 100 });
    bets.set(2, { side: "yes", amount: 200 });
    bets.set(3, { side: "no", amount: 320 });

    const payouts = calculatePayouts(bets, "yes");

    // FID 1: 100 back + floor(320 * 100/300) = 100 + 106 = 206
    expect(payouts.get(1)).toBe(206);
    // FID 2: 200 back + floor(320 * 200/300) = 200 + 213 = 413
    expect(payouts.get(2)).toBe(413);
    // FID 3: loses, no payout
    expect(payouts.has(3)).toBe(false);
  });

  it("returns bets back when losing pool is zero", () => {
    const bets = new Map<number, { side: "yes" | "no"; amount: number }>();
    bets.set(1, { side: "yes", amount: 50 });
    bets.set(2, { side: "yes", amount: 30 });

    const payouts = calculatePayouts(bets, "yes");

    expect(payouts.get(1)).toBe(50);
    expect(payouts.get(2)).toBe(30);
  });

  it("returns empty map when no bets exist", () => {
    const bets = new Map<number, { side: "yes" | "no"; amount: number }>();
    const payouts = calculatePayouts(bets, "no");
    expect(payouts.size).toBe(0);
  });

  it("handles single winner taking entire losing pool", () => {
    const bets = new Map<number, { side: "yes" | "no"; amount: number }>();
    bets.set(1, { side: "no", amount: 40 });
    bets.set(2, { side: "yes", amount: 100 });
    bets.set(3, { side: "yes", amount: 60 });

    const payouts = calculatePayouts(bets, "no");

    // FID 1: 40 back + floor(160 * 40/40) = 40 + 160 = 200
    expect(payouts.get(1)).toBe(200);
    expect(payouts.has(2)).toBe(false);
    expect(payouts.has(3)).toBe(false);
  });
});
