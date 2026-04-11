// src/types.ts

export interface Market {
  id: string;
  question: string;
  creatorFid: number;
  optionA: string;
  optionB: string;
  votesA: number;
  votesB: number;
  resolved: boolean;
  outcome: "a" | "b" | null;
}

export interface Bet {
  side: "a" | "b";
  amount: number;
}

export interface UserData {
  balance: number;
}

export type Side = "a" | "b";
