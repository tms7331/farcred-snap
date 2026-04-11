// src/types.ts

export interface Market {
  id: string;
  question: string;
  creatorFid: number;
  yesVotes: number;
  noVotes: number;
  resolved: boolean;
  outcome: "yes" | "no" | null;
}

export interface Bet {
  side: "yes" | "no";
  amount: number;
}

export interface UserData {
  balance: number;
}

export type Side = "yes" | "no";
