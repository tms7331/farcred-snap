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

function optionLabel(market: Market, side: Side): string {
  return side === "a" ? market.optionA : market.optionB;
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
  const totalVotes = market.votesA + market.votesB;
  const nav = navButtons(idx, total, base);
  const pctA = totalVotes > 0 ? Math.round((market.votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? Math.round((market.votesB / totalVotes) * 100) : 50;

  const elements: Record<string, any> = {
    root: { type: "stack", props: {}, children: ["question", "meta", "progress", "actions", "nav"] },
    question: { type: "text", props: { content: market.question, weight: "bold" } },
    meta: { type: "text", props: { content: `${totalVotes} votes placed \u00b7 You have ${balance} votes`, size: "sm" } },
    progress: {
      type: "progress",
      props: {
        value: market.votesA,
        max: Math.max(totalVotes, 1),
        label: `${market.optionA} ${pctA}% \u2014 ${pctB}% ${market.optionB}`,
      },
    },
    ...nav,
  };

  if (market.resolved) {
    const winner = optionLabel(market, market.outcome!);
    elements.actions = { type: "text", props: { content: `Resolved: ${winner} won`, weight: "bold" } };
  } else if (existingBet) {
    const picked = optionLabel(market, existingBet.side);
    elements.actions = { type: "text", props: { content: `You bet ${existingBet.amount} votes on ${picked}`, size: "sm" } };
  } else {
    elements.actions = { type: "stack", props: { direction: "horizontal", gap: "sm" }, children: ["bet-a", "bet-b"] };
    elements["bet-a"] = { type: "button", props: { label: market.optionA, variant: "primary" }, on: { press: { action: "submit", params: { target: `${base}/?action=bet&market=${market.id}&side=a` } } } };
    elements["bet-b"] = { type: "button", props: { label: market.optionB }, on: { press: { action: "submit", params: { target: `${base}/?action=bet&market=${market.id}&side=b` } } } };
  }

  return { version: "1.0", theme: { accent: "purple" }, ui: { root: "root", elements } };
}

export function buildResolveView(market: Market, idx: number, total: number, balance: number, base: string): SnapResponse {
  const totalVotes = market.votesA + market.votesB;
  const pctA = totalVotes > 0 ? Math.round((market.votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? Math.round((market.votesB / totalVotes) * 100) : 50;
  const nav = navButtons(idx, total, base);

  return {
    version: "1.0",
    theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: {}, children: ["question", "meta", "progress", "resolve-btns", "nav"] },
        question: { type: "text", props: { content: market.question, weight: "bold" } },
        meta: { type: "text", props: { content: `You created this \u00b7 ${totalVotes} total votes`, size: "sm" } },
        progress: {
          type: "progress",
          props: {
            value: market.votesA,
            max: Math.max(totalVotes, 1),
            label: `${market.optionA} ${pctA}% \u2014 ${pctB}% ${market.optionB}`,
          },
        },
        "resolve-btns": { type: "stack", props: { direction: "horizontal", gap: "sm" }, children: ["resolve-a", "resolve-b"] },
        "resolve-a": { type: "button", props: { label: `${market.optionA} wins`, variant: "primary" }, on: { press: { action: "submit", params: { target: `${base}/?action=resolve&market=${market.id}&outcome=a` } } } },
        "resolve-b": { type: "button", props: { label: `${market.optionB} wins` }, on: { press: { action: "submit", params: { target: `${base}/?action=resolve&market=${market.id}&outcome=b` } } } },
        ...nav,
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
  const picked = optionLabel(market, side);
  // Offer preset amounts capped to balance, max 6 options (toggle_group limit)
  const presets = [5, 10, 25, 50, 100].filter(n => n <= balance);
  if (balance > 0 && (presets.length === 0 || presets[presets.length - 1] !== balance)) {
    presets.push(balance);
  }
  const options = presets.slice(0, 6).map(String);

  return {
    version: "1.0",
    theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: {}, children: ["question", "side-label", "amount-toggle", "balance-text", "btn-row"] },
        question: { type: "text", props: { content: market.question, weight: "bold" } },
        "side-label": { type: "text", props: { content: `Betting on: ${picked}`, size: "sm" } },
        "amount-toggle": { type: "toggle_group", props: { name: "amount", options, defaultValue: options[0], label: "How many votes?" } },
        "balance-text": { type: "text", props: { content: `${balance} votes available`, size: "sm" } },
        "btn-row": { type: "stack", props: { direction: "horizontal", gap: "sm" }, children: ["back-btn", "confirm-btn"] },
        "back-btn": { type: "button", props: { label: "\u2190 Back" }, on: { press: { action: "submit", params: { target: `${base}/` } } } },
        "confirm-btn": { type: "button", props: { label: "Confirm Bet", variant: "primary" }, on: { press: { action: "submit", params: { target: `${base}/?action=confirm&market=${market.id}&side=${side}` } } } },
      },
    },
  };
}

export function buildConfirmation(market: Market, side: Side, amount: number, remainingBalance: number, base: string): SnapResponse {
  const picked = optionLabel(market, side);
  return {
    version: "1.0",
    theme: { accent: "purple" },
    effects: ["confetti"],
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: {}, children: ["title", "detail", "remaining", "back-btn"] },
        title: { type: "text", props: { content: "Bet Placed!", weight: "bold" } },
        detail: { type: "text", props: { content: `${amount} votes on ${picked}` } },
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
        root: { type: "stack", props: {}, children: ["title", "question-input", "option-a-input", "option-b-input", "btn-row"] },
        title: { type: "text", props: { content: "Create a Market", weight: "bold" } },
        "question-input": { type: "input", props: { name: "question", type: "text", label: "Question", placeholder: "Who will win the match?", maxLength: 280 } },
        "option-a-input": { type: "input", props: { name: "optionA", type: "text", label: "Option A", placeholder: "Team Alpha", maxLength: 30 } },
        "option-b-input": { type: "input", props: { name: "optionB", type: "text", label: "Option B", placeholder: "Team Beta", maxLength: 30 } },
        "btn-row": { type: "stack", props: { direction: "horizontal", gap: "sm" }, children: ["cancel-btn", "submit-btn"] },
        "cancel-btn": { type: "button", props: { label: "\u2190 Cancel" }, on: { press: { action: "submit", params: { target: `${base}/` } } } },
        "submit-btn": { type: "button", props: { label: "Create Market", variant: "primary" }, on: { press: { action: "submit", params: { target: `${base}/?action=submit_market` } } } },
      },
    },
  };
}
