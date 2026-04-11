# Prediction Market Snap — Design Spec

## Overview

A Farcaster Snap that lets users bet on binary (Yes/No) prediction markets using a virtual vote currency. Users start with 100 votes, browse markets by swiping left/right, place bets, create new markets, and resolve markets they created. Winners split the losers' pool proportionally.

## Tech Stack

- **Runtime:** Hono (TypeScript) with `@farcaster/snap-hono`
- **Persistence:** `@farcaster/snap-turso` KV store (in-memory dev, Turso production)
- **Auth:** JFS (JSON Farcaster Signatures) — automatic via `@farcaster/snap-hono`
- **Validation:** `@farcaster/snap` for types and response validation
- **Deployment:** Vercel

## Core Mechanic

- Every user starts with **100 votes** (initialized on first interaction)
- Votes are a **scarce global resource** — 100 total across all markets
- When a market resolves, winners receive their bet back + a proportional share of the losers' pool
- No vote refresh for MVP (future: monthly replenishment)

## Screens

### Screen 1: Market View (Landing)

The main screen. Displays one market at a time with navigation.

**Layout (5 root children):**

| # | Component | Content |
|---|-----------|---------|
| 1 | `text` (bold) | Market question (max 320 chars) |
| 2 | `text` (sm) | "by @creator · X votes placed · You have Y votes" |
| 3 | `progress` | Yes/No split visualization (value = yesVotes, max = totalVotes) |
| 4 | `stack` (horizontal) | Two buttons: "Bet YES" (primary) / "Bet NO" (secondary) |
| 5 | `stack` (horizontal) | Three buttons: "← Prev" / "+ Create" / "Next →" |

**Behavior:**
- `GET /` returns the newest market (last in index)
- If the current user is the market creator and the market is unresolved, show "Resolve" button instead of bet buttons
- If the user already bet on this market, replace bet buttons with a `text` showing "You bet X votes on YES/NO" (no double-betting)
- If no markets exist, show a welcome message with just the Create button

### Screen 2: Place Bet

User picks how many votes to wager.

**Layout (5 root children):**

| # | Component | Content |
|---|-----------|---------|
| 1 | `text` (bold) | Market question |
| 2 | `text` (sm) | "Betting YES" or "Betting NO" |
| 3 | `slider` | name="amount", min=1, max=user's balance, step=1, defaultValue=10 |
| 4 | `text` (sm) | "X of Y votes available" |
| 5 | `stack` (horizontal) | Two buttons: "← Back" / "Confirm Bet" |

**Behavior:**
- Slider max is capped to the user's current balance
- Side (yes/no) is passed via query param from the previous screen

### Screen 3: Bet Confirmation

Confirms the bet was placed.

**Layout (4 root children):**

| # | Component | Content |
|---|-----------|---------|
| 1 | `text` (bold) | "Bet Placed!" |
| 2 | `text` | "X votes on YES/NO" |
| 3 | `text` (sm) | "Market: [question] · Y votes remaining" |
| 4 | `button` | "← Back to Markets" |

**Behavior:**
- Shows confetti effect on render
- Navigates back to the market the user just bet on

### Screen 4: Create Market

Simple form to submit a new market question.

**Layout (3 root children):**

| # | Component | Content |
|---|-----------|---------|
| 1 | `text` (bold) | "Create a Market" |
| 2 | `input` | name="question", type="text", label="Your yes/no question", maxLength=280 |
| 3 | `stack` (horizontal) | Two buttons: "← Cancel" / "Create Market" |

**Behavior:**
- On submit, creates a new market with the user as creator
- Returns to market view showing the newly created market

### Screen 5: Resolve Market (Creator Only)

Shown to the creator of an unresolved market instead of bet buttons.

**Layout (5 root children):**

| # | Component | Content |
|---|-----------|---------|
| 1 | `text` (bold) | Market question |
| 2 | `text` (sm) | "You created this market · X total votes" |
| 3 | `progress` | Yes/No split visualization |
| 4 | `stack` (horizontal) | Two buttons: "Resolve YES" / "Resolve NO" |
| 5 | `button` | "← Back to Markets" |

**Behavior:**
- Only accessible when `ctx.action.fid === market.creatorFid`
- On resolve: marks market as resolved, calculates payouts, distributes votes to winners
- Returns to market view with updated state

## Navigation Flow

```
GET /                          → Market View (newest market)
POST ?action=nav&dir=next      → Market View (next index, wraps)
POST ?action=nav&dir=prev      → Market View (prev index, wraps)
POST ?action=bet&market=ID&side=yes  → Place Bet screen
POST ?action=bet&market=ID&side=no   → Place Bet screen
POST ?action=confirm&market=ID&side=yes  → Bet Confirmation (processes bet)
POST ?action=create            → Create Market form
POST ?action=submit_market     → Market View (new market created)
POST ?action=resolve&market=ID&outcome=yes  → Market View (payouts distributed)
POST ?action=resolve&market=ID&outcome=no   → Market View (payouts distributed)
```

## Data Model (KV Store)

### Keys

| Key Pattern | Value | Description |
|-------------|-------|-------------|
| `market:{id}` | `{ id, question, creatorFid, yesVotes, noVotes, resolved, outcome }` | Market data |
| `market:{id}:bet:{fid}` | `{ side: "yes"\|"no", amount: number }` | A user's bet on a market |
| `user:{fid}` | `{ balance: number }` | User's remaining vote balance |
| `markets:index` | `string[]` (market IDs, newest last) | Ordered list for navigation |
| `markets:count` | `number` | Counter for generating next market ID |

### Initialization

- On first interaction, if `user:{fid}` does not exist, create it with `{ balance: 100 }`
- `markets:index` starts as `[]`
- `markets:count` starts at `0`

## Payout Logic

When a market is resolved with outcome O:

1. Identify the winning side (O) and losing side
2. Calculate total losing pool (sum of all losing bets)
3. For each winning bettor:
   - `share = bettor.amount / winningSideTotal`
   - `payout = bettor.amount + floor(losingPool × share)`
   - Add payout to bettor's balance
4. Losing bettors get nothing back (votes already deducted when bet was placed)

**Edge cases:**
- Losing pool is 0 → winners get their bets back (no profit)
- No bets at all → resolve is a no-op, market just gets marked resolved
- Rounding: use `Math.floor()`, a few votes may be lost to rounding (acceptable for MVP)

## Constraints Validation

| Constraint | Limit | Our Max | Status |
|------------|-------|---------|--------|
| Root children | 7 | 5 | OK |
| Total elements | 64 | ~15 | OK |
| Nesting depth | 4 | 3 | OK |
| Children per container | 6 | 3 | OK |
| Text content | 320 chars | Question ≤ 280 | OK |
| Button label | 30 chars | ~15 | OK |
| POST timeout | 5 seconds | Simple KV ops | OK |

## Out of Scope (Future)

- Vote refresh/replenishment (monthly)
- Moderation of user-created markets
- Market deadlines/expiry
- Leaderboard
- "My bets" view
- Multiple choice markets
- Changing or adding to an existing bet
- Market categories/tags
