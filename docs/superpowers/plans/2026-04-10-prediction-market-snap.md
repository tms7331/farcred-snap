# Prediction Market Snap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Farcaster Snap prediction market where users bet virtual votes on binary yes/no markets, browse markets with prev/next navigation, create new markets, and resolve markets they created with proportional payouts.

**Architecture:** A single Hono TypeScript server using `@farcaster/snap-hono` for request handling and `@farcaster/snap-turso` for KV persistence. The handler routes actions via URL query params (`?action=nav`, `?action=bet`, etc.) and returns JSON UI responses. No client-side code — Farcaster renders everything.

**Tech Stack:** Hono, TypeScript, `@farcaster/snap-hono`, `@farcaster/snap-turso`, `@farcaster/snap`, vitest (testing)

**Spec:** `docs/superpowers/specs/2026-04-10-prediction-market-snap-design.md`

---

## File Structure

```
src/
  index.ts      — Hono app, registerSnapHandler, action routing
  store.ts      — KV store instance + data access helpers
  screens.ts    — All screen builder functions (return SnapResponse objects)
  payout.ts     — Payout calculation (pure function)
  types.ts      — Market, Bet, UserData type definitions
tests/
  payout.test.ts   — Unit tests for payout logic
  screens.test.ts  — Structural tests for screen builders
  store.test.ts    — Unit tests for store helpers
package.json
tsconfig.json
vitest.config.ts
.env             — SNAP_PUBLIC_BASE_URL=http://localhost:3003
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.env`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "prediction-market-snap",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@farcaster/snap": "latest",
    "@farcaster/snap-hono": "latest",
    "@farcaster/snap-turso": "latest",
    "hono": "^4",
    "@hono/node-server": "^1"
  },
  "devDependencies": {
    "tsx": "^4",
    "typescript": "^5",
    "vitest": "^3",
    "@types/node": "^22"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Create .env and .gitignore**

`.env`:
```
SNAP_PUBLIC_BASE_URL=http://localhost:3003
SKIP_JFS_VERIFICATION=1
```

`.gitignore`:
```
node_modules/
dist/
.env
.superpowers/
```

- [ ] **Step 5: Install dependencies**

Run: `pnpm install`
Expected: lockfile created, all packages installed

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .env .gitignore pnpm-lock.yaml
git commit -m "feat: scaffold snap project with dependencies"
```

---

### Task 2: Type Definitions

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create type definitions**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add type definitions for Market, Bet, UserData"
```

---

### Task 3: Payout Logic

**Files:**
- Create: `src/payout.ts`
- Create: `tests/payout.test.ts`

- [ ] **Step 1: Write failing tests for payout calculation**

```typescript
// tests/payout.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- tests/payout.test.ts`
Expected: FAIL — cannot find module `../src/payout.js`

- [ ] **Step 3: Implement payout calculation**

```typescript
// src/payout.ts
import type { Side } from "./types.js";

/**
 * Calculate payouts for a resolved market.
 * Winners get their bet back + proportional share of the losing pool.
 * Returns a map of fid -> payout amount.
 */
export function calculatePayouts(
  bets: Map<number, { side: Side; amount: number }>,
  outcome: Side,
): Map<number, number> {
  const payouts = new Map<number, number>();

  let winningTotal = 0;
  let losingTotal = 0;

  for (const [, bet] of bets) {
    if (bet.side === outcome) {
      winningTotal += bet.amount;
    } else {
      losingTotal += bet.amount;
    }
  }

  for (const [fid, bet] of bets) {
    if (bet.side === outcome) {
      const share = bet.amount / winningTotal;
      const payout = bet.amount + Math.floor(losingTotal * share);
      payouts.set(fid, payout);
    }
  }

  return payouts;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- tests/payout.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/payout.ts tests/payout.test.ts
git commit -m "feat: add payout calculation with proportional distribution"
```

---

### Task 4: Store Helpers

**Files:**
- Create: `src/store.ts`
- Create: `tests/store.test.ts`

- [ ] **Step 1: Write failing tests for store helpers**

```typescript
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
    // Reset store state between tests by overwriting keys
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
        yesVotes: 0,
        noVotes: 0,
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
      await setUserBet("1", 123, { side: "yes", amount: 25 });
      const bet = await getUserBet("1", 123);
      expect(bet).toEqual({ side: "yes", amount: 25 });
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- tests/store.test.ts`
Expected: FAIL — cannot find module `../src/store.js`

- [ ] **Step 3: Implement store helpers**

```typescript
// src/store.ts
import { createTursoDataStore } from "@farcaster/snap-turso";
import type { Market, Bet, UserData } from "./types.js";

export const store = createTursoDataStore();

export async function getOrCreateUser(fid: number): Promise<UserData> {
  const user = (await store.get(`user:${fid}`)) as UserData | null;
  if (user) return user;
  const newUser: UserData = { balance: 100 };
  await store.set(`user:${fid}`, newUser);
  return newUser;
}

export async function setUser(fid: number, data: UserData): Promise<void> {
  await store.set(`user:${fid}`, data);
}

export async function getMarket(id: string): Promise<Market | null> {
  return (await store.get(`market:${id}`)) as Market | null;
}

export async function setMarket(market: Market): Promise<void> {
  await store.set(`market:${market.id}`, market);
}

export async function getMarketsIndex(): Promise<string[]> {
  return ((await store.get("markets:index")) as string[] | null) ?? [];
}

export async function addMarketToIndex(id: string): Promise<void> {
  const index = await getMarketsIndex();
  index.push(id);
  await store.set("markets:index", index);
}

export async function getNextMarketId(): Promise<string> {
  const count = ((await store.get("markets:count")) as number | null) ?? 0;
  const next = count + 1;
  await store.set("markets:count", next);
  return String(next);
}

export async function getUserBet(
  marketId: string,
  fid: number,
): Promise<Bet | null> {
  return (await store.get(`market:${marketId}:bet:${fid}`)) as Bet | null;
}

export async function setUserBet(
  marketId: string,
  fid: number,
  bet: Bet,
): Promise<void> {
  await store.set(`market:${marketId}:bet:${fid}`, bet);
}

export async function getBettors(marketId: string): Promise<number[]> {
  return ((await store.get(`market:${marketId}:bettors`)) as number[] | null) ?? [];
}

export async function addBettor(
  marketId: string,
  fid: number,
): Promise<void> {
  const bettors = await getBettors(marketId);
  bettors.push(fid);
  await store.set(`market:${marketId}:bettors`, bettors);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- tests/store.test.ts`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/store.ts tests/store.test.ts
git commit -m "feat: add KV store helpers for users, markets, bets, and bettor tracking"
```

---

### Task 5: Screen Builders

**Files:**
- Create: `src/screens.ts`
- Create: `tests/screens.test.ts`

- [ ] **Step 1: Write failing tests for screen builders**

```typescript
// tests/screens.test.ts
import { describe, it, expect } from "vitest";
import {
  buildMarketView,
  buildEmptyState,
  buildPlaceBet,
  buildConfirmation,
  buildCreateMarket,
  buildResolveView,
} from "../src/screens.js";
import type { Market } from "../src/types.js";

const BASE = "http://localhost:3003";

const sampleMarket: Market = {
  id: "1",
  question: "Will ETH hit $5,000?",
  creatorFid: 100,
  yesVotes: 527,
  noVotes: 320,
  resolved: false,
  outcome: null,
};

describe("screen builders", () => {
  it("buildMarketView returns valid snap response", () => {
    const resp = buildMarketView(sampleMarket, 0, 3, 73, null, BASE);
    expect(resp.version).toBe("2.0");
    expect(resp.ui.root).toBeDefined();
    expect(resp.ui.elements).toBeDefined();
    const root = resp.ui.elements[resp.ui.root];
    expect(root.children!.length).toBeLessThanOrEqual(7);
  });

  it("buildMarketView shows bet info when user already bet", () => {
    const resp = buildMarketView(
      sampleMarket, 0, 3, 73,
      { side: "yes", amount: 25 },
      BASE,
    );
    const elements = resp.ui.elements;
    const hasBetText = Object.values(elements).some(
      (el: any) => el.type === "text" && el.props.content.includes("25 votes on YES"),
    );
    expect(hasBetText).toBe(true);
  });

  it("buildEmptyState returns create button", () => {
    const resp = buildEmptyState(100, BASE);
    expect(resp.version).toBe("2.0");
    const elements = resp.ui.elements;
    const hasCreateBtn = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label.includes("Create"),
    );
    expect(hasCreateBtn).toBe(true);
  });

  it("buildPlaceBet includes slider with correct max", () => {
    const resp = buildPlaceBet(sampleMarket, "yes", 73, BASE);
    expect(resp.version).toBe("2.0");
    const elements = resp.ui.elements;
    const slider = Object.values(elements).find(
      (el: any) => el.type === "slider",
    ) as any;
    expect(slider).toBeDefined();
    expect(slider.props.max).toBe(73);
    expect(slider.props.min).toBe(1);
  });

  it("buildConfirmation shows confetti effect", () => {
    const resp = buildConfirmation(sampleMarket, "yes", 25, 48, BASE);
    expect(resp.effects).toContain("confetti");
  });

  it("buildCreateMarket includes input field", () => {
    const resp = buildCreateMarket(BASE);
    expect(resp.version).toBe("2.0");
    const elements = resp.ui.elements;
    const input = Object.values(elements).find(
      (el: any) => el.type === "input",
    ) as any;
    expect(input).toBeDefined();
    expect(input.props.name).toBe("question");
  });

  it("buildResolveView shows resolve buttons", () => {
    const resp = buildResolveView(sampleMarket, 0, 3, 73, BASE);
    expect(resp.version).toBe("2.0");
    const elements = resp.ui.elements;
    const resolveYes = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label.includes("YES"),
    );
    const resolveNo = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label.includes("NO"),
    );
    expect(resolveYes).toBe(true);
    expect(resolveNo).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- tests/screens.test.ts`
Expected: FAIL — cannot find module `../src/screens.js`

- [ ] **Step 3: Implement screen builders**

```typescript
// src/screens.ts
import type { Market, Bet, Side } from "./types.js";

interface SnapResponse {
  version: "2.0";
  theme?: { accent: string };
  effects?: string[];
  ui: {
    root: string;
    elements: Record<string, any>;
  };
}

function navButtons(
  idx: number,
  total: number,
  base: string,
): Record<string, any> {
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
      on: {
        press: {
          action: "submit",
          params: { target: `${base}/?action=nav&dir=prev&idx=${prev}` },
        },
      },
    },
    "create-btn": {
      type: "button",
      props: { label: "+ Create" },
      on: {
        press: {
          action: "submit",
          params: { target: `${base}/?action=create` },
        },
      },
    },
    "next-btn": {
      type: "button",
      props: { label: "Next \u2192" },
      on: {
        press: {
          action: "submit",
          params: { target: `${base}/?action=nav&dir=next&idx=${next}` },
        },
      },
    },
  };
}

export function buildMarketView(
  market: Market,
  idx: number,
  total: number,
  balance: number,
  existingBet: Bet | null,
  base: string,
): SnapResponse {
  const totalVotes = market.yesVotes + market.noVotes;
  const nav = navButtons(idx, total, base);

  const elements: Record<string, any> = {
    root: {
      type: "stack",
      props: {},
      children: ["question", "meta", "progress", "actions", "nav"],
    },
    question: {
      type: "text",
      props: { content: market.question, weight: "bold" },
    },
    meta: {
      type: "text",
      props: {
        content: `${totalVotes} votes placed \u00b7 You have ${balance} votes`,
        size: "sm",
      },
    },
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
    elements.actions = {
      type: "text",
      props: {
        content: `Resolved: ${market.outcome!.toUpperCase()} won`,
        weight: "bold",
      },
    };
  } else if (existingBet) {
    elements.actions = {
      type: "text",
      props: {
        content: `You bet ${existingBet.amount} votes on ${existingBet.side.toUpperCase()}`,
        size: "sm",
      },
    };
  } else {
    elements.actions = {
      type: "stack",
      props: { direction: "horizontal", gap: "sm" },
      children: ["bet-yes", "bet-no"],
    };
    elements["bet-yes"] = {
      type: "button",
      props: { label: "Bet YES", variant: "primary" },
      on: {
        press: {
          action: "submit",
          params: {
            target: `${base}/?action=bet&market=${market.id}&side=yes`,
          },
        },
      },
    };
    elements["bet-no"] = {
      type: "button",
      props: { label: "Bet NO" },
      on: {
        press: {
          action: "submit",
          params: {
            target: `${base}/?action=bet&market=${market.id}&side=no`,
          },
        },
      },
    };
  }

  return { version: "2.0", theme: { accent: "purple" }, ui: { root: "root", elements } };
}

export function buildResolveView(
  market: Market,
  idx: number,
  total: number,
  balance: number,
  base: string,
): SnapResponse {
  const totalVotes = market.yesVotes + market.noVotes;
  const nav = navButtons(idx, total, base);

  return {
    version: "2.0",
    theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: {
          type: "stack",
          props: {},
          children: ["question", "meta", "progress", "resolve-btns", "back-btn"],
        },
        question: {
          type: "text",
          props: { content: market.question, weight: "bold" },
        },
        meta: {
          type: "text",
          props: {
            content: `You created this \u00b7 ${totalVotes} total votes`,
            size: "sm",
          },
        },
        progress: {
          type: "progress",
          props: {
            value: market.yesVotes,
            max: Math.max(totalVotes, 1),
            label: `YES ${totalVotes > 0 ? Math.round((market.yesVotes / totalVotes) * 100) : 50}% \u2014 ${totalVotes > 0 ? Math.round((market.noVotes / totalVotes) * 100) : 50}% NO`,
          },
        },
        "resolve-btns": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["resolve-yes", "resolve-no"],
        },
        "resolve-yes": {
          type: "button",
          props: { label: "Resolve YES", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: {
                target: `${base}/?action=resolve&market=${market.id}&outcome=yes`,
              },
            },
          },
        },
        "resolve-no": {
          type: "button",
          props: { label: "Resolve NO" },
          on: {
            press: {
              action: "submit",
              params: {
                target: `${base}/?action=resolve&market=${market.id}&outcome=no`,
              },
            },
          },
        },
        "back-btn": {
          type: "button",
          props: { label: "\u2190 Back to Markets" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?action=nav&dir=next&idx=${idx}` },
            },
          },
        },
      },
    },
  };
}

export function buildEmptyState(balance: number, base: string): SnapResponse {
  return {
    version: "2.0",
    theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: {
          type: "stack",
          props: {},
          children: ["title", "subtitle", "create-btn"],
        },
        title: {
          type: "text",
          props: { content: "Prediction Market", weight: "bold" },
        },
        subtitle: {
          type: "text",
          props: {
            content: `No markets yet. You have ${balance} votes \u2014 create the first market!`,
            size: "sm",
          },
        },
        "create-btn": {
          type: "button",
          props: { label: "Create a Market", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?action=create` },
            },
          },
        },
      },
    },
  };
}

export function buildPlaceBet(
  market: Market,
  side: Side,
  balance: number,
  base: string,
): SnapResponse {
  return {
    version: "2.0",
    theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: {
          type: "stack",
          props: {},
          children: ["question", "side-label", "amount-slider", "balance-text", "btn-row"],
        },
        question: {
          type: "text",
          props: { content: market.question, weight: "bold" },
        },
        "side-label": {
          type: "text",
          props: {
            content: `Betting ${side.toUpperCase()}`,
            size: "sm",
          },
        },
        "amount-slider": {
          type: "slider",
          props: {
            name: "amount",
            min: 1,
            max: balance,
            step: 1,
            defaultValue: Math.min(10, balance),
            label: "How many votes?",
            showValue: true,
          },
        },
        "balance-text": {
          type: "text",
          props: {
            content: `${balance} votes available`,
            size: "sm",
          },
        },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["back-btn", "confirm-btn"],
        },
        "back-btn": {
          type: "button",
          props: { label: "\u2190 Back" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/` },
            },
          },
        },
        "confirm-btn": {
          type: "button",
          props: { label: "Confirm Bet", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: {
                target: `${base}/?action=confirm&market=${market.id}&side=${side}`,
              },
            },
          },
        },
      },
    },
  };
}

export function buildConfirmation(
  market: Market,
  side: Side,
  amount: number,
  remainingBalance: number,
  base: string,
): SnapResponse {
  return {
    version: "2.0",
    theme: { accent: "purple" },
    effects: ["confetti"],
    ui: {
      root: "root",
      elements: {
        root: {
          type: "stack",
          props: {},
          children: ["title", "detail", "remaining", "back-btn"],
        },
        title: {
          type: "text",
          props: { content: "Bet Placed!", weight: "bold" },
        },
        detail: {
          type: "text",
          props: {
            content: `${amount} votes on ${side.toUpperCase()}`,
          },
        },
        remaining: {
          type: "text",
          props: {
            content: `${market.question} \u00b7 ${remainingBalance} votes remaining`,
            size: "sm",
          },
        },
        "back-btn": {
          type: "button",
          props: { label: "\u2190 Back to Markets" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/` },
            },
          },
        },
      },
    },
  };
}

export function buildCreateMarket(base: string): SnapResponse {
  return {
    version: "2.0",
    theme: { accent: "purple" },
    ui: {
      root: "root",
      elements: {
        root: {
          type: "stack",
          props: {},
          children: ["title", "question-input", "btn-row"],
        },
        title: {
          type: "text",
          props: { content: "Create a Market", weight: "bold" },
        },
        "question-input": {
          type: "input",
          props: {
            name: "question",
            type: "text",
            label: "Your yes/no question",
            placeholder: "Will ETH hit $5,000 by August 2025?",
            maxLength: 280,
          },
        },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["cancel-btn", "submit-btn"],
        },
        "cancel-btn": {
          type: "button",
          props: { label: "\u2190 Cancel" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/` },
            },
          },
        },
        "submit-btn": {
          type: "button",
          props: { label: "Create Market", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?action=submit_market` },
            },
          },
        },
      },
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- tests/screens.test.ts`
Expected: all 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens.ts tests/screens.test.ts
git commit -m "feat: add all screen builder functions"
```

---

### Task 6: Main Handler and Routing

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Implement the main handler**

```typescript
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

registerSnapHandler(app, async (ctx) => {
  if (ctx.action.type === "get") {
    // No fid on GET — show newest market without user-specific info
    const index = await getMarketsIndex();
    if (index.length === 0) {
      return buildEmptyState(100, BASE);
    }
    const lastIdx = index.length - 1;
    const market = await getMarket(index[lastIdx]);
    if (!market) return buildEmptyState(100, BASE);
    return buildMarketView(market, lastIdx, index.length, 100, null, BASE);
  }

  const fid = ctx.action.user.fid;
  const url = new URL(ctx.request.url);
  const action = url.searchParams.get("action");

  // --- Navigation ---
  if (action === "nav") {
    const idx = parseInt(url.searchParams.get("idx") ?? "0", 10);
    return showMarketAtIndex(fid, idx);
  }

  // --- Show bet screen ---
  if (action === "bet") {
    const marketId = url.searchParams.get("market")!;
    const side = url.searchParams.get("side") as Side;
    const market = await getMarket(marketId);
    if (!market) return showMarketAtIndex(fid, 0);
    const user = await getOrCreateUser(fid);
    return buildPlaceBet(market, side, user.balance, BASE);
  }

  // --- Confirm bet ---
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

    // Deduct votes from user
    user.balance -= amount;
    await setUser(fid, user);

    // Record the bet and track the bettor
    await setUserBet(marketId, fid, { side, amount });
    await addBettor(marketId, fid);

    // Update market totals
    if (side === "yes") {
      market.yesVotes += amount;
    } else {
      market.noVotes += amount;
    }
    await setMarket(market);

    return buildConfirmation(market, side, amount, user.balance, BASE);
  }

  // --- Show create form ---
  if (action === "create") {
    return buildCreateMarket(BASE);
  }

  // --- Submit new market ---
  if (action === "submit_market") {
    const question = (ctx.action.inputs.question as string ?? "").trim();
    if (!question) return buildCreateMarket(BASE);

    const id = await getNextMarketId();
    const market: Market = {
      id,
      question,
      creatorFid: fid,
      yesVotes: 0,
      noVotes: 0,
      resolved: false,
      outcome: null,
    };
    await setMarket(market);
    await addMarketToIndex(id);

    const index = await getMarketsIndex();
    return showMarketAtIndex(fid, index.length - 1);
  }

  // --- Resolve market ---
  if (action === "resolve") {
    const marketId = url.searchParams.get("market")!;
    const outcome = url.searchParams.get("outcome") as Side;
    const market = await getMarket(marketId);

    if (!market || market.resolved || market.creatorFid !== fid) {
      return showMarketAtIndex(fid, 0);
    }

    // Collect all bets for this market
    const bets = new Map<number, { side: Side; amount: number }>();
    const bettorFids = await getBettors(marketId);

    for (const bettorFid of bettorFids) {
      const bet = await getUserBet(marketId, bettorFid);
      if (bet) bets.set(bettorFid, bet);
    }

    // Calculate and distribute payouts
    const payouts = calculatePayouts(bets, outcome);
    for (const [payeeFid, payout] of payouts) {
      const payeeUser = await getOrCreateUser(payeeFid);
      payeeUser.balance += payout;
      await setUser(payeeFid, payeeUser);
    }

    // Mark market resolved
    market.resolved = true;
    market.outcome = outcome;
    await setMarket(market);

    return showMarketAtIndex(fid, 0);
  }

  // Fallback: show first market
  return showMarketAtIndex(fid, 0);
});

const port = parseInt(process.env.PORT ?? "3003", 10);
serve({ fetch: app.fetch, port }, () => {
  console.log(`Snap server running at http://localhost:${port}`);
});
```

- [ ] **Step 2: Commit**

```bash
git add src/index.ts
git commit -m "feat: add main handler with full action routing"
```

---

### Task 7: Local Testing

**Files:** (none created)

- [ ] **Step 1: Start the dev server**

Run: `SKIP_JFS_VERIFICATION=1 pnpm dev`
Expected: `Snap server running at http://localhost:3003`

- [ ] **Step 2: Test GET request (initial load)**

Run in a second terminal:
```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' http://localhost:3003/ | jq .
```
Expected: JSON response with `version: "2.0"`, empty state with "Create a Market" button

- [ ] **Step 3: Test create market POST**

```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/vnd.farcaster.snap+json' \
  http://localhost:3003/?action=submit_market \
  -d '{"fid":1,"user":{"fid":1},"inputs":{"question":"Will ETH hit $5,000?"},"timestamp":1717200000,"audience":"http://localhost:3003"}' | jq .
```
Expected: JSON response showing the newly created market

- [ ] **Step 4: Test navigation**

```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/vnd.farcaster.snap+json' \
  'http://localhost:3003/?action=nav&dir=next&idx=0' \
  -d '{"fid":2,"user":{"fid":2},"inputs":{},"timestamp":1717200000,"audience":"http://localhost:3003"}' | jq .
```
Expected: Market view with bet buttons (fid 2 is not the creator)

- [ ] **Step 5: Test placing a bet**

```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/vnd.farcaster.snap+json' \
  'http://localhost:3003/?action=confirm&market=1&side=yes' \
  -d '{"fid":2,"user":{"fid":2},"inputs":{"amount":25},"timestamp":1717200000,"audience":"http://localhost:3003"}' | jq .
```
Expected: Confirmation screen with confetti effect, 25 votes on YES, 75 remaining

- [ ] **Step 6: Test the snap emulator**

Open `https://farcaster.xyz/~/developers/snaps` in a browser.
Enter `http://localhost:3003` as the snap URL.
Verify: market view loads, navigation works, betting flow completes.

- [ ] **Step 7: Commit any fixes**

```bash
git add -A
git commit -m "fix: adjustments from local testing"
```

---

### Task 8: Deployment

**Files:**
- (none created — uses existing code)

- [ ] **Step 1: Deploy to Neynar hosting**

Follow the deployment steps:
1. Create an archive excluding `node_modules`, `dist`, `.env`:
```bash
tar -czf snap.tar.gz --exclude=node_modules --exclude=dist --exclude=.env --exclude=.superpowers --exclude=.git .
```

2. Deploy via Neynar (or Vercel). Set environment variable:
   - `SNAP_PUBLIC_BASE_URL` = `https://<project>.host.neynar.app` (or your Vercel URL)

- [ ] **Step 2: Verify deployment**

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' https://<your-url>/ | jq .version
```
Expected: `"2.0"`

- [ ] **Step 3: Cast the snap URL on Farcaster to test in production**

Create a cast containing your snap URL. Verify it renders as an interactive snap in the feed.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: production deployment config"
```
