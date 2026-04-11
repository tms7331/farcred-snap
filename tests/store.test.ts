// tests/store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrCreateUser,
  getMarket,
  setMarket,
  getMarketsIndex,
  addMarketToIndex,
  getNextMarketId,
  getUserBet,
  setUserBet,
  setUser,
  getBettors,
  addBettor,
  store,
} from "../src/store.js";

describe("store helpers", () => {
  beforeEach(async () => {
    await store.set("markets:index", []);
    await store.set("markets:count", 0);
  });

  describe("getOrCreateUser", () => {
    it("creates user with 100 balance on first access", async () => {
      const user = await getOrCreateUser(999);
      expect(user.balance).toBe(100);
    });

    it("returns existing user on subsequent access", async () => {
      await setUser(999, { balance: 42 });
      const user = await getOrCreateUser(999);
      expect(user.balance).toBe(42);
    });
  });

  describe("markets index", () => {
    it("starts with empty index", async () => {
      const index = await getMarketsIndex();
      expect(index).toEqual([]);
    });

    it("adds market IDs to index", async () => {
      await addMarketToIndex("m1");
      await addMarketToIndex("m2");
      const index = await getMarketsIndex();
      expect(index).toEqual(["m1", "m2"]);
    });
  });

  describe("getNextMarketId", () => {
    it("returns incrementing IDs", async () => {
      const id1 = await getNextMarketId();
      const id2 = await getNextMarketId();
      expect(id1).toBe("1");
      expect(id2).toBe("2");
    });
  });

  describe("market CRUD", () => {
    it("returns null for missing market", async () => {
      const m = await getMarket("nonexistent");
      expect(m).toBeNull();
    });

    it("stores and retrieves a market", async () => {
      const market = {
        id: "1",
        question: "Will ETH hit 5k?",
        creatorFid: 123,
        optionA: "Yes",
        optionB: "No",
        votesA: 0,
        votesB: 0,
        resolved: false,
        outcome: null,
      };
      await setMarket(market);
      const result = await getMarket("1");
      expect(result).toEqual(market);
    });
  });

  describe("bets", () => {
    it("returns null for missing bet", async () => {
      const bet = await getUserBet("1", 123);
      expect(bet).toBeNull();
    });

    it("stores and retrieves a bet", async () => {
      await setUserBet("1", 123, { side: "a", amount: 25 });
      const bet = await getUserBet("1", 123);
      expect(bet).toEqual({ side: "a", amount: 25 });
    });
  });

  describe("bettor tracking", () => {
    it("starts with empty bettors list", async () => {
      const bettors = await getBettors("m1");
      expect(bettors).toEqual([]);
    });

    it("tracks bettors for a market", async () => {
      await addBettor("m1", 100);
      await addBettor("m1", 200);
      const bettors = await getBettors("m1");
      expect(bettors).toEqual([100, 200]);
    });
  });
});
