// src/index.ts
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { registerSnapHandler } from "@farcaster/snap-hono";
import { cors } from "hono/cors";
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
  addBettor,
  getBettors,
} from "./store.js";
import {
  buildMarketView,
  buildEmptyState,
  buildPlaceBet,
  buildConfirmation,
  buildCreateMarket,
  buildResolveView,
} from "./screens.js";
import { calculatePayouts } from "./payout.js";
import type { Side, Market } from "./types.js";

const app = new Hono();
app.use("*", cors());

const BASE = process.env.SNAP_PUBLIC_BASE_URL ?? "http://localhost:3003";

async function showMarketAtIndex(fid: number, idx: number) {
  const user = await getOrCreateUser(fid);
  const index = await getMarketsIndex();

  if (index.length === 0) {
    return buildEmptyState(user.balance, BASE);
  }

  const clampedIdx = ((idx % index.length) + index.length) % index.length;
  const marketId = index[clampedIdx];
  const market = await getMarket(marketId);

  if (!market) {
    return buildEmptyState(user.balance, BASE);
  }

  if (!market.resolved && market.creatorFid === fid) {
    return buildResolveView(market, clampedIdx, index.length, user.balance, BASE);
  }

  const existingBet = await getUserBet(marketId, fid);
  return buildMarketView(market, clampedIdx, index.length, user.balance, existingBet, BASE);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
registerSnapHandler(app, async (ctx: any): Promise<any> => {
  if (ctx.action.type === "get") {
    const index = await getMarketsIndex();
    if (index.length === 0) {
      return buildEmptyState(100, BASE);
    }
    const lastIdx = index.length - 1;
    const market = await getMarket(index[lastIdx]);
    if (!market) return buildEmptyState(100, BASE);
    return buildMarketView(market, lastIdx, index.length, 100, null, BASE);
  }

  const fid = ctx.action.fid;
  const url = new URL(ctx.request.url);
  const action = url.searchParams.get("action");

  if (action === "nav") {
    const idx = parseInt(url.searchParams.get("idx") ?? "0", 10);
    return showMarketAtIndex(fid, idx);
  }

  if (action === "bet") {
    const marketId = url.searchParams.get("market")!;
    const side = url.searchParams.get("side") as Side;
    const market = await getMarket(marketId);
    if (!market) return showMarketAtIndex(fid, 0);
    const user = await getOrCreateUser(fid);
    return buildPlaceBet(market, side, user.balance, BASE);
  }

  if (action === "confirm") {
    const marketId = url.searchParams.get("market")!;
    const side = url.searchParams.get("side") as Side;
    const market = await getMarket(marketId);
    if (!market || market.resolved) return showMarketAtIndex(fid, 0);

    const existing = await getUserBet(marketId, fid);
    if (existing) return showMarketAtIndex(fid, 0);

    const user = await getOrCreateUser(fid);
    const amount = Math.max(1, Math.min(
      Number(ctx.action.inputs.amount) || 10,
      user.balance,
    ));

    user.balance -= amount;
    await setUser(fid, user);

    await setUserBet(marketId, fid, { side, amount });
    await addBettor(marketId, fid);

    if (side === "a") {
      market.votesA += amount;
    } else {
      market.votesB += amount;
    }
    await setMarket(market);

    return buildConfirmation(market, side, amount, user.balance, BASE);
  }

  if (action === "create") {
    return buildCreateMarket(BASE);
  }

  if (action === "submit_market") {
    const question = (ctx.action.inputs.question as string ?? "").trim();
    const optionA = (ctx.action.inputs.optionA as string ?? "").trim() || "Yes";
    const optionB = (ctx.action.inputs.optionB as string ?? "").trim() || "No";
    if (!question) return buildCreateMarket(BASE);

    const id = await getNextMarketId();
    const market: Market = {
      id,
      question,
      creatorFid: fid,
      optionA,
      optionB,
      votesA: 0,
      votesB: 0,
      resolved: false,
      outcome: null,
    };
    await setMarket(market);
    await addMarketToIndex(id);

    const index = await getMarketsIndex();
    return showMarketAtIndex(fid, index.length - 1);
  }

  if (action === "resolve") {
    const marketId = url.searchParams.get("market")!;
    const outcome = url.searchParams.get("outcome") as Side;
    const market = await getMarket(marketId);

    if (!market || market.resolved || market.creatorFid !== fid) {
      return showMarketAtIndex(fid, 0);
    }

    const bets = new Map<number, { side: Side; amount: number }>();
    const bettorFids = await getBettors(marketId);

    for (const bettorFid of bettorFids) {
      const bet = await getUserBet(marketId, bettorFid);
      if (bet) bets.set(bettorFid, bet);
    }

    const payouts = calculatePayouts(bets, outcome);
    for (const [payeeFid, payout] of payouts) {
      const payeeUser = await getOrCreateUser(payeeFid);
      payeeUser.balance += payout;
      await setUser(payeeFid, payeeUser);
    }

    market.resolved = true;
    market.outcome = outcome;
    await setMarket(market);

    return showMarketAtIndex(fid, 0);
  }

  return showMarketAtIndex(fid, 0);
});

const port = parseInt(process.env.PORT ?? "3003", 10);
serve({ fetch: app.fetch, port }, () => {
  console.log(`Snap server running at http://localhost:${port}`);
});
