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

function amountOptions(balance: number): string[] {
  const presets = [5, 10, 25, 50, 100].filter(n => n <= balance);
  if (balance > 0 && (presets.length === 0 || presets[presets.length - 1] !== balance)) {
    presets.push(balance);
  }
  return presets.slice(0, 6).map(String);
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

function creatorNavButtons(market: Market, idx: number, total: number, base: string): Record<string, any> {
  const prev = (idx - 1 + total) % total;
  const next = (idx + 1) % total;
  return {
    nav: {
      type: "stack",
      props: { direction: "horizontal", gap: "sm" },
      children: ["prev-btn", "resolve-btn", "next-btn"],
    },
    "prev-btn": {
      type: "button",
      props: { label: "\u2190 Prev" },
      on: { press: { action: "submit", params: { target: `${base}/?action=nav&dir=prev&idx=${prev}` } } },
    },
    "resolve-btn": {
      type: "button",
      props: { label: "Resolve" },
      on: { press: { action: "submit", params: { target: `${base}/?action=resolve_view&market=${market.id}&idx=${idx}` } } },
    },
    "next-btn": {
      type: "button",
      props: { label: "Next \u2192" },
      on: { press: { action: "submit", params: { target: `${base}/?action=nav&dir=next&idx=${next}` } } },
    },
  };
}

export function buildMarketView(
  market: Market, idx: number, total: number, balance: number, existingBet: Bet | null, isCreator: boolean, base: string,
): SnapResponse {
  const totalVotes = market.votesA + market.votesB;
  const pctA = totalVotes > 0 ? Math.round((market.votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? Math.round((market.votesB / totalVotes) * 100) : 50;

  const nav = isCreator && !market.resolved
    ? creatorNavButtons(market, idx, total, base)
    : navButtons(idx, total, base);

  if (market.resolved) {
    // Resolved: show outcome, no betting
    const winner = optionLabel(market, market.outcome!);
    return {
      version: "1.0", theme: { accent: "purple" },
      ui: {
        root: "root",
        elements: {
          root: { type: "stack", props: {}, children: ["question", "meta", "progress", "result", "nav"] },
          question: { type: "text", props: { content: market.question, weight: "bold" } },
          meta: { type: "text", props: { content: `${totalVotes} cred placed`, size: "sm" } },
          progress: { type: "progress", props: { value: market.votesA, max: Math.max(totalVotes, 1), label: `${market.optionA} ${pctA}% \u2014 ${pctB}% ${market.optionB}` } },
          result: { type: "text", props: { content: `Resolved: ${winner} won`, weight: "bold" } },
          ...nav,
        },
      },
    };
  }

  if (existingBet) {
    // Already bet: show position, no more betting
    const picked = optionLabel(market, existingBet.side);
    return {
      version: "1.0", theme: { accent: "purple" },
      ui: {
        root: "root",
        elements: {
          root: { type: "stack", props: {}, children: ["question", "meta", "progress", "position", "nav"] },
          question: { type: "text", props: { content: market.question, weight: "bold" } },
          meta: { type: "text", props: { content: `${totalVotes} cred placed \u00b7 You have ${balance} cred`, size: "sm" } },
          progress: { type: "progress", props: { value: market.votesA, max: Math.max(totalVotes, 1), label: `${market.optionA} ${pctA}% \u2014 ${pctB}% ${market.optionB}` } },
          position: { type: "text", props: { content: `You bet ${existingBet.amount} cred on ${picked}`, size: "sm" } },
          ...nav,
        },
      },
    };
  }

  // Active market: side picker + amount picker + bet button, all on one page
  // 7 root children (max allowed): question, meta, progress, side-toggle, amount-toggle, bet-btn, nav
  const options = amountOptions(balance);
  return {
    version: "1.0", theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: {}, children: ["question", "progress", "side-toggle", "amount-toggle", "bet-btn", "nav"] },
        question: { type: "text", props: { content: market.question, weight: "bold" } },
        progress: { type: "progress", props: { value: market.votesA, max: Math.max(totalVotes, 1), label: `${market.optionA} ${pctA}% \u2014 ${pctB}% ${market.optionB}` } },
        "side-toggle": { type: "toggle_group", props: { name: "side", options: [market.optionA, market.optionB], defaultValue: market.optionA, label: `Pick a side (${balance} cred)` } },
        "amount-toggle": { type: "toggle_group", props: { name: "amount", options, defaultValue: options[0], label: "How much cred?" } },
        "bet-btn": {
          type: "button",
          props: { label: "Place Bet", variant: "primary" },
          on: { press: { action: "submit", params: { target: `${base}/?action=confirm&market=${market.id}` } } },
        },
        ...nav,
      },
    },
  };
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
        meta: { type: "text", props: { content: `You created this \u00b7 ${totalVotes} total cred`, size: "sm" } },
        progress: { type: "progress", props: { value: market.votesA, max: Math.max(totalVotes, 1), label: `${market.optionA} ${pctA}% \u2014 ${pctB}% ${market.optionB}` } },
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
        title: { type: "text", props: { content: "FarCred", weight: "bold" } },
        subtitle: { type: "text", props: { content: `Welcome to FarCred! You have ${balance} cred \u2014 create the first market!`, size: "sm" } },
        "create-btn": { type: "button", props: { label: "Create a Market", variant: "primary" }, on: { press: { action: "submit", params: { target: `${base}/?action=create` } } } },
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
