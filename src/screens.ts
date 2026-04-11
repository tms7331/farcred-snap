import type { Market, Bet, Side } from "./types.js";

interface SnapResponse {
  version: "1.0";
  theme?: { accent?: string };
  effects?: string[];
  ui: {
    root: string;
    elements: Record<string, any>;
  };
}

function navButtons(idx: number, total: number, base: string): Record<string, any> {
  const prev = (idx - 1 + total) % total;
  const next = (idx + 1) % total;
  return {
    nav: {
      type: "stack",
      props: { direction: "horizontal", gap: "sm" },
      children: ["prev-btn", "create-btn", "next-btn"],
    },
    "prev-btn": {
      type: "button",
      props: { label: "\u2190 Prev" },
      on: { press: { action: "submit", params: { target: `${base}/?action=nav&dir=prev&idx=${prev}` } } },
    },
    "create-btn": {
      type: "button",
      props: { label: "+ Create" },
      on: { press: { action: "submit", params: { target: `${base}/?action=create` } } },
    },
    "next-btn": {
      type: "button",
      props: { label: "Next \u2192" },
      on: { press: { action: "submit", params: { target: `${base}/?action=nav&dir=next&idx=${next}` } } },
    },
  };
}

export function buildMarketView(
  market: Market, idx: number, total: number, balance: number, existingBet: Bet | null, base: string,
): SnapResponse {
  const totalVotes = market.yesVotes + market.noVotes;
  const nav = navButtons(idx, total, base);
  const elements: Record<string, any> = {
    root: { type: "stack", props: {}, children: ["question", "meta", "progress", "actions", "nav"] },
    question: { type: "text", props: { content: market.question, weight: "bold" } },
    meta: { type: "text", props: { content: `${totalVotes} votes placed \u00b7 You have ${balance} votes`, size: "sm" } },
    progress: {
      type: "progress",
      props: {
        value: market.yesVotes,
        max: Math.max(totalVotes, 1),
        label: `YES ${totalVotes > 0 ? Math.round((market.yesVotes / totalVotes) * 100) : 50}% \u2014 ${totalVotes > 0 ? Math.round((market.noVotes / totalVotes) * 100) : 50}% NO`,
      },
    },
    ...nav,
  };

  if (market.resolved) {
    elements.actions = { type: "text", props: { content: `Resolved: ${market.outcome!.toUpperCase()} won`, weight: "bold" } };
  } else if (existingBet) {
    elements.actions = { type: "text", props: { content: `You bet ${existingBet.amount} votes on ${existingBet.side.toUpperCase()}`, size: "sm" } };
  } else {
    elements.actions = { type: "stack", props: { direction: "horizontal", gap: "sm" }, children: ["bet-yes", "bet-no"] };
    elements["bet-yes"] = { type: "button", props: { label: "Bet YES", variant: "primary" }, on: { press: { action: "submit", params: { target: `${base}/?action=bet&market=${market.id}&side=yes` } } } };
    elements["bet-no"] = { type: "button", props: { label: "Bet NO" }, on: { press: { action: "submit", params: { target: `${base}/?action=bet&market=${market.id}&side=no` } } } };
  }

  return { version: "1.0", theme: { accent: "purple" }, ui: { root: "root", elements } };
}

export function buildResolveView(market: Market, idx: number, total: number, balance: number, base: string): SnapResponse {
  const totalVotes = market.yesVotes + market.noVotes;
  return {
    version: "1.0",
    theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: {}, children: ["question", "meta", "progress", "resolve-btns", "back-btn"] },
        question: { type: "text", props: { content: market.question, weight: "bold" } },
        meta: { type: "text", props: { content: `You created this \u00b7 ${totalVotes} total votes`, size: "sm" } },
        progress: {
          type: "progress",
          props: {
            value: market.yesVotes,
            max: Math.max(totalVotes, 1),
            label: `YES ${totalVotes > 0 ? Math.round((market.yesVotes / totalVotes) * 100) : 50}% \u2014 ${totalVotes > 0 ? Math.round((market.noVotes / totalVotes) * 100) : 50}% NO`,
          },
        },
        "resolve-btns": { type: "stack", props: { direction: "horizontal", gap: "sm" }, children: ["resolve-yes", "resolve-no"] },
        "resolve-yes": { type: "button", props: { label: "Resolve YES", variant: "primary" }, on: { press: { action: "submit", params: { target: `${base}/?action=resolve&market=${market.id}&outcome=yes` } } } },
        "resolve-no": { type: "button", props: { label: "Resolve NO" }, on: { press: { action: "submit", params: { target: `${base}/?action=resolve&market=${market.id}&outcome=no` } } } },
        "back-btn": { type: "button", props: { label: "\u2190 Back to Markets" }, on: { press: { action: "submit", params: { target: `${base}/?action=nav&dir=next&idx=${idx}` } } } },
      },
    },
  };
}

export function buildEmptyState(balance: number, base: string): SnapResponse {
  return {
    version: "1.0",
    theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: {}, children: ["title", "subtitle", "create-btn"] },
        title: { type: "text", props: { content: "Prediction Market", weight: "bold" } },
        subtitle: { type: "text", props: { content: `No markets yet. You have ${balance} votes \u2014 create the first market!`, size: "sm" } },
        "create-btn": { type: "button", props: { label: "Create a Market", variant: "primary" }, on: { press: { action: "submit", params: { target: `${base}/?action=create` } } } },
      },
    },
  };
}

export function buildPlaceBet(market: Market, side: Side, balance: number, base: string): SnapResponse {
  return {
    version: "1.0",
    theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: {}, children: ["question", "side-label", "amount-slider", "balance-text", "btn-row"] },
        question: { type: "text", props: { content: market.question, weight: "bold" } },
        "side-label": { type: "text", props: { content: `Betting ${side.toUpperCase()}`, size: "sm" } },
        "amount-slider": { type: "slider", props: { name: "amount", min: 1, max: balance, step: 1, defaultValue: Math.min(10, balance), label: "How many votes?", showValue: true } },
        "balance-text": { type: "text", props: { content: `${balance} votes available`, size: "sm" } },
        "btn-row": { type: "stack", props: { direction: "horizontal", gap: "sm" }, children: ["back-btn", "confirm-btn"] },
        "back-btn": { type: "button", props: { label: "\u2190 Back" }, on: { press: { action: "submit", params: { target: `${base}/` } } } },
        "confirm-btn": { type: "button", props: { label: "Confirm Bet", variant: "primary" }, on: { press: { action: "submit", params: { target: `${base}/?action=confirm&market=${market.id}&side=${side}` } } } },
      },
    },
  };
}

export function buildConfirmation(market: Market, side: Side, amount: number, remainingBalance: number, base: string): SnapResponse {
  return {
    version: "1.0",
    theme: { accent: "purple" },
    effects: ["confetti"],
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: {}, children: ["title", "detail", "remaining", "back-btn"] },
        title: { type: "text", props: { content: "Bet Placed!", weight: "bold" } },
        detail: { type: "text", props: { content: `${amount} votes on ${side.toUpperCase()}` } },
        remaining: { type: "text", props: { content: `${market.question} \u00b7 ${remainingBalance} votes remaining`, size: "sm" } },
        "back-btn": { type: "button", props: { label: "\u2190 Back to Markets" }, on: { press: { action: "submit", params: { target: `${base}/` } } } },
      },
    },
  };
}

export function buildCreateMarket(base: string): SnapResponse {
  return {
    version: "1.0",
    theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: {}, children: ["title", "question-input", "btn-row"] },
        title: { type: "text", props: { content: "Create a Market", weight: "bold" } },
        "question-input": { type: "input", props: { name: "question", type: "text", label: "Your yes/no question", placeholder: "Will ETH hit $5,000 by August 2025?", maxLength: 280 } },
        "btn-row": { type: "stack", props: { direction: "horizontal", gap: "sm" }, children: ["cancel-btn", "submit-btn"] },
        "cancel-btn": { type: "button", props: { label: "\u2190 Cancel" }, on: { press: { action: "submit", params: { target: `${base}/` } } } },
        "submit-btn": { type: "button", props: { label: "Create Market", variant: "primary" }, on: { press: { action: "submit", params: { target: `${base}/?action=submit_market` } } } },
      },
    },
  };
}
