// src/store.ts
import { createTursoDataStore } from "@farcaster/snap-turso";
import type { Market, Bet, UserData } from "./types.js";

export const store = createTursoDataStore();

export async function getOrCreateUser(fid: number): Promise<UserData> {
  const user = (await store.get(`user:${fid}`)) as UserData | null | undefined;
  if (user != null) return user;
  const newUser: UserData = { balance: 100 };
  await store.set(`user:${fid}`, newUser);
  return newUser;
}

export async function setUser(fid: number, data: UserData): Promise<void> {
  await store.set(`user:${fid}`, data);
}

export async function getMarket(id: string): Promise<Market | null> {
  const result = (await store.get(`market:${id}`)) as Market | null | undefined;
  return result ?? null;
}

export async function setMarket(market: Market): Promise<void> {
  await store.set(`market:${market.id}`, market);
}

export async function getMarketsIndex(): Promise<string[]> {
  const result = (await store.get("markets:index")) as string[] | null | undefined;
  return result ?? [];
}

export async function addMarketToIndex(id: string): Promise<void> {
  const index = await getMarketsIndex();
  index.push(id);
  await store.set("markets:index", index);
}

export async function getNextMarketId(): Promise<string> {
  const count = (await store.get("markets:count")) as number | null | undefined;
  const next = (count ?? 0) + 1;
  await store.set("markets:count", next);
  return String(next);
}

export async function getUserBet(
  marketId: string,
  fid: number,
): Promise<Bet | null> {
  const result = (await store.get(`market:${marketId}:bet:${fid}`)) as Bet | null | undefined;
  return result ?? null;
}

export async function setUserBet(
  marketId: string,
  fid: number,
  bet: Bet,
): Promise<void> {
  await store.set(`market:${marketId}:bet:${fid}`, bet);
}

export async function getBettors(marketId: string): Promise<number[]> {
  const result = (await store.get(`market:${marketId}:bettors`)) as number[] | null | undefined;
  return result ?? [];
}

export async function addBettor(marketId: string, fid: number): Promise<void> {
  const bettors = await getBettors(marketId);
  bettors.push(fid);
  await store.set(`market:${marketId}:bettors`, bettors);
}
