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

function marketHeader(market: Market, creatorName: string): Record<string, any> {
  return {
    header: {
      type: "stack",
      props: { direction: "horizontal", justify: "between" },
      children: ["question", "creator-btn"],
    },
    question: { type: "text", props: { content: market.question, weight: "bold", size: "lg" } },
    "creator-btn": {
      type: "button",
      props: { label: `Creator: @${creatorName}`, icon: "user" },
      on: { press: { action: "view_profile", params: { fid: market.creatorFid } } },
    },
  };
}

function marketChart(market: Market): Record<string, any> {
  const totalVotes = market.votesA + market.votesB;
  const pctA = totalVotes > 0 ? Math.round((market.votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? Math.round((market.votesB / totalVotes) * 100) : 50;
  return {
    chart: {
      type: "progress",
      props: {
        value: market.votesA,
        max: Math.max(totalVotes, 1),
        label: `${market.optionA} ${pctA}% \u2014 ${pctB}% ${market.optionB}`,
      },
    },
  };
}

function marketNav(idx: number, total: number, isCreator: boolean, market: Market | null, base: string): Record<string, any> {
  const prev = (idx - 1 + total) % total;
  const next = (idx + 1) % total;

  const children = ["prev-btn", "menu-btn", "next-btn"];
  const elements: Record<string, any> = {
    nav: {
      type: "stack",
      props: { direction: "horizontal", gap: "sm" },
      children,
    },
    "prev-btn": {
      type: "button",
      props: { label: "\u2190 Prev", variant: "primary" },
      on: { press: { action: "submit", params: { target: `${base}/?action=nav&dir=prev&idx=${prev}` } } },
    },
    "menu-btn": {
      type: "button",
      props: { label: "Menu" },
      on: { press: { action: "submit", params: { target: `${base}/?action=menu` } } },
    },
    "next-btn": {
      type: "button",
      props: { label: "Next \u2192", variant: "primary" },
      on: { press: { action: "submit", params: { target: `${base}/?action=nav&dir=next&idx=${next}` } } },
    },
  };

  // Add resolve button for creators (4 children max 6, fine)
  if (isCreator && market && !market.resolved) {
    children.splice(2, 0, "resolve-btn");
    elements["resolve-btn"] = {
      type: "button",
      props: { label: "Resolve", variant: "primary", icon: "zap" },
      on: { press: { action: "submit", params: { target: `${base}/?action=resolve_view&market=${market.id}&idx=${idx}` } } },
    };
  }

  return elements;
}

function menuButton(base: string): Record<string, any> {
  return {
    "menu-btn": {
      type: "button",
      props: { label: "\u2190 Menu" },
      on: { press: { action: "submit", params: { target: `${base}/?action=menu` } } },
    },
  };
}

// --- Menu ---

export function buildMenu(balance: number, base: string): SnapResponse {
  return {
    version: "1.0",
    theme: { accent: "amber" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: { gap: "lg" }, children: ["logo", "balance-badge", "sep", "make-bet-btn", "my-bets-btn", "create-btn"] },
        logo: { type: "image", props: { url: "https://raw.githubusercontent.com/tms7331/farcred-snap/main/public/farcredlogo.png", aspect: "16:9", alt: "FarCred" } },
        "balance-badge": { type: "badge", props: { label: `${balance} cred available`, color: "amber", icon: "coins" } },
        sep: { type: "separator", props: {} },
        "make-bet-btn": {
          type: "button",
          props: { label: "Browse Markets", variant: "primary", icon: "trending-up" },
          on: { press: { action: "submit", params: { target: `${base}/?action=nav&idx=0` } } },
        },
        "my-bets-btn": {
          type: "button",
          props: { label: "My Bets", variant: "primary", icon: "wallet" },
          on: { press: { action: "submit", params: { target: `${base}/?action=my_bets` } } },
        },
        "create-btn": {
          type: "button",
          props: { label: "Create Market", variant: "primary", icon: "plus" },
          on: { press: { action: "submit", params: { target: `${base}/?action=create` } } },
        },
      },
    },
  };
}

// --- My Bets ---

export function buildMyBets(
  bets: Array<{ market: Market; bet: Bet; idx: number }>,
  balance: number,
  base: string,
): SnapResponse {
  if (bets.length === 0) {
    return {
      version: "1.0",
      theme: { accent: "amber" },
      ui: {
        root: "root",
        elements: {
          root: { type: "stack", props: { gap: "md" }, children: ["title", "balance-badge", "empty", "browse-btn", "menu-btn"] },
          title: { type: "text", props: { content: "My Bets", weight: "bold", size: "lg", align: "center" } },
          "balance-badge": { type: "badge", props: { label: `${balance} cred available`, color: "amber", icon: "coins" } },
          empty: { type: "text", props: { content: `No bets yet \u2014 go find a market!`, size: "sm", align: "center" } },
          "browse-btn": {
            type: "button",
            props: { label: "Browse Markets", variant: "primary", icon: "trending-up" },
            on: { press: { action: "submit", params: { target: `${base}/?action=nav&idx=0` } } },
          },
          ...menuButton(base),
        },
      },
    };
  }

  // Show up to 5 bets using item_group > item (max 6 children per container, save room)
  const shown = bets.slice(0, 5);
  const betItems = shown.map((b, i) => `bet-${i}`);
  const betElements: Record<string, any> = {};

  for (let i = 0; i < shown.length; i++) {
    const { market, bet, idx } = shown[i];
    const picked = optionLabel(market, bet.side);
    const status = market.resolved
      ? (market.outcome === bet.side ? "\u2705 Won" : "\u274c Lost")
      : "\u23f3 Open";
    betElements[`bet-${i}`] = {
      type: "item",
      props: {
        title: market.question.slice(0, 80),
        description: `${bet.amount} cred on ${picked} \u00b7 ${status}`,
      },
      children: [`view-${i}`],
    };
    betElements[`view-${i}`] = {
      type: "button",
      props: { label: "View", variant: "primary", icon: "arrow-right" },
      on: { press: { action: "submit", params: { target: `${base}/?action=nav&idx=${idx}` } } },
    };
  }

  return {
    version: "1.0",
    theme: { accent: "amber" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: { gap: "md" }, children: ["title", "balance-badge", "bet-list", "menu-btn"] },
        title: { type: "text", props: { content: "My Bets", weight: "bold", size: "lg", align: "center" } },
        "balance-badge": { type: "badge", props: { label: `${balance} cred available`, color: "amber", icon: "coins" } },
        "bet-list": {
          type: "item_group",
          props: { separator: true, border: true },
          children: betItems,
        },
        ...betElements,
        ...menuButton(base),
      },
    },
  };
}

// --- Market View ---

export function buildMarketView(
  market: Market, idx: number, total: number, balance: number, existingBet: Bet | null, isCreator: boolean, base: string, creatorName: string,
): SnapResponse {
  const totalVotes = market.votesA + market.votesB;
  const chart = marketChart(market);
  const nav = marketNav(idx, total, isCreator, market, base);

  if (market.resolved) {
    const winner = optionLabel(market, market.outcome!);
    return {
      version: "1.0", theme: { accent: "amber" },
      ui: {
        root: "root",
        elements: {
          root: { type: "stack", props: { gap: "md" }, children: ["header", "result", "chart", "meta", "sep", "nav"] },
          ...marketHeader(market, creatorName),
          result: { type: "badge", props: { label: `${winner} won`, color: "green", icon: "trophy" } },
          ...chart,
          meta: { type: "text", props: { content: `${totalVotes} total cred`, size: "sm", align: "center" } },
          sep: { type: "separator", props: {} },
          ...nav,
        },
      },
    };
  }

  if (existingBet) {
    const picked = optionLabel(market, existingBet.side);
    return {
      version: "1.0", theme: { accent: "amber" },
      ui: {
        root: "root",
        elements: {
          root: { type: "stack", props: { gap: "md" }, children: ["header", "position", "chart", "meta", "sep", "nav"] },
          ...marketHeader(market, creatorName),
          position: { type: "badge", props: { label: `${existingBet.amount} cred on ${picked}`, color: "amber", icon: "check" } },
          ...chart,
          meta: { type: "text", props: { content: `${totalVotes} cred placed \u00b7 You have ${balance} cred`, size: "sm" } },
          sep: { type: "separator", props: {} },
          ...nav,
        },
      },
    };
  }

  const options = amountOptions(balance);
  return {
    version: "1.0", theme: { accent: "amber" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: { gap: "md" }, children: ["header", "chart", "balance-badge", "side-toggle", "amount-toggle", "bet-btn", "nav"] },
        ...marketHeader(market, creatorName),
        ...chart,
        "balance-badge": { type: "badge", props: { label: `${balance} cred available`, color: "amber", icon: "wallet" } },
        "side-toggle": { type: "toggle_group", props: { name: "side", options: [market.optionA, market.optionB], defaultValue: market.optionA, label: "Pick a side" } },
        "amount-toggle": { type: "toggle_group", props: { name: "amount", options, defaultValue: options[0], label: "How much cred?" } },
        "bet-btn": {
          type: "button",
          props: { label: "Place Bet", variant: "primary", icon: "zap" },
          on: { press: { action: "submit", params: { target: `${base}/?action=confirm&market=${market.id}` } } },
        },
        ...nav,
      },
    },
  };
}

// --- Resolve ---

export function buildResolveView(market: Market, idx: number, total: number, balance: number, base: string): SnapResponse {
  const totalVotes = market.votesA + market.votesB;
  const chart = marketChart(market);

  return {
    version: "1.0",
    theme: { accent: "amber" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: { gap: "md" }, children: ["question", "chart", "stats-badge", "sep", "resolve-btns", "delete-btn", "menu-btn"] },
        question: { type: "text", props: { content: market.question, weight: "bold", size: "lg" } },
        ...chart,
        "stats-badge": { type: "badge", props: { label: `${totalVotes} total cred`, color: "amber", icon: "trending-up" } },
        sep: { type: "separator", props: {} },
        "resolve-btns": { type: "stack", props: { direction: "horizontal", gap: "sm" }, children: ["resolve-a", "resolve-b"] },
        "resolve-a": { type: "button", props: { label: `${market.optionA} wins`, variant: "primary", icon: "check" }, on: { press: { action: "submit", params: { target: `${base}/?action=resolve&market=${market.id}&outcome=a` } } } },
        "resolve-b": { type: "button", props: { label: `${market.optionB} wins`, variant: "primary", icon: "x" }, on: { press: { action: "submit", params: { target: `${base}/?action=resolve&market=${market.id}&outcome=b` } } } },
        "delete-btn": { type: "button", props: { label: "Delete Market", icon: "x" }, on: { press: { action: "submit", params: { target: `${base}/?action=delete_market&market=${market.id}` } } } },
        ...menuButton(base),
      },
    },
  };
}

// --- Empty State ---

export function buildEmptyState(balance: number, base: string): SnapResponse {
  return buildMenu(balance, base);
}

// --- Not Eligible ---

export function buildNotEligible(base: string): SnapResponse {
  return {
    version: "1.0",
    theme: { accent: "amber" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: { gap: "md" }, children: ["title", "msg", "menu-btn"] },
        title: { type: "text", props: { content: "Not Eligible", weight: "bold", size: "lg", align: "center" } },
        msg: { type: "text", props: { content: "Your account needs a Neynar score of at least 0.9 to create markets.", size: "sm", align: "center" } },
        ...menuButton(base),
      },
    },
  };
}

// --- Create Market ---

export function buildCreateMarket(base: string): SnapResponse {
  return {
    version: "1.0",
    theme: { accent: "amber" },
    ui: {
      root: "root",
      elements: {
        root: { type: "stack", props: { gap: "md" }, children: ["title", "sep", "question-input", "option-a-input", "option-b-input", "btn-row"] },
        title: { type: "text", props: { content: "Create a Market", weight: "bold", size: "lg", align: "center" } },
        sep: { type: "separator", props: {} },
        "question-input": { type: "input", props: { name: "question", type: "text", label: "Question", placeholder: "Who will win the match?", maxLength: 280 } },
        "option-a-input": { type: "input", props: { name: "optionA", type: "text", label: "Option A", placeholder: "Team Alpha", maxLength: 30 } },
        "option-b-input": { type: "input", props: { name: "optionB", type: "text", label: "Option B", placeholder: "Team Beta", maxLength: 30 } },
        "btn-row": { type: "stack", props: { direction: "horizontal", gap: "sm" }, children: ["cancel-btn", "submit-btn"] },
        "cancel-btn": { type: "button", props: { label: "\u2190 Menu" }, on: { press: { action: "submit", params: { target: `${base}/?action=menu` } } } },
        "submit-btn": { type: "button", props: { label: "Create Market", variant: "primary", icon: "plus" }, on: { press: { action: "submit", params: { target: `${base}/?action=submit_market` } } } },
      },
    },
  };
}
