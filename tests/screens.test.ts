import { describe, it, expect } from "vitest";
import {
  buildMarketView,
  buildEmptyState,
  buildCreateMarket,
  buildResolveView,
  buildMenu,
  buildMyBets,
} from "../src/screens.js";
import type { Market } from "../src/types.js";

const BASE = "http://localhost:3003";

const sampleMarket: Market = {
  id: "1",
  question: "Will ETH hit $5,000?",
  creatorFid: 100,
  optionA: "Over 5k",
  optionB: "Under 5k",
  votesA: 527,
  votesB: 320,
  resolved: false,
  outcome: null,
};

describe("screen builders", () => {
  it("buildMarketView shows progress and toggle groups for active market", () => {
    const resp = buildMarketView(sampleMarket, 0, 3, 73, null, false, BASE);
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const chart = Object.values(elements).find((el: any) => el.type === "progress") as any;
    expect(chart).toBeDefined();
    expect(chart.props.label).toContain("Over 5k");
    const toggles = Object.values(elements).filter((el: any) => el.type === "toggle_group") as any[];
    expect(toggles).toHaveLength(2);
  });

  it("buildMarketView includes Menu button in nav", () => {
    const resp = buildMarketView(sampleMarket, 0, 3, 73, null, false, BASE);
    const elements = resp.ui.elements;
    const hasMenu = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label === "Menu",
    );
    expect(hasMenu).toBe(true);
  });

  it("buildMarketView shows badge when user already bet", () => {
    const resp = buildMarketView(sampleMarket, 0, 3, 73, { side: "a", amount: 25 }, false, BASE);
    const elements = resp.ui.elements;
    const badge = Object.values(elements).find(
      (el: any) => el.type === "badge" && el.props.label.includes("25 cred on Over 5k"),
    );
    expect(badge).toBeDefined();
  });

  it("buildMenu shows three navigation options", () => {
    const resp = buildMenu(73, BASE);
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const buttons = Object.values(elements).filter((el: any) => el.type === "button") as any[];
    const labels = buttons.map((b: any) => b.props.label);
    expect(labels).toContain("Browse Markets");
    expect(labels).toContain("My Bets");
    expect(labels).toContain("Create Market");
  });

  it("buildMyBets shows bet items with view buttons", () => {
    const resp = buildMyBets(
      [{ market: sampleMarket, bet: { side: "a", amount: 25 }, idx: 0 }],
      48, BASE,
    );
    const elements = resp.ui.elements;
    const itemGroup = Object.values(elements).find((el: any) => el.type === "item_group");
    expect(itemGroup).toBeDefined();
    const viewBtn = Object.values(elements).find(
      (el: any) => el.type === "button" && el.props.label === "View",
    );
    expect(viewBtn).toBeDefined();
  });

  it("buildMyBets shows empty state when no bets", () => {
    const resp = buildMyBets([], 100, BASE);
    const elements = resp.ui.elements;
    const hasEmpty = Object.values(elements).some(
      (el: any) => el.type === "text" && el.props.content.includes("No bets yet"),
    );
    expect(hasEmpty).toBe(true);
  });

  it("buildEmptyState returns menu", () => {
    const resp = buildEmptyState(100, BASE);
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const hasCreate = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label.includes("Create"),
    );
    expect(hasCreate).toBe(true);
  });

  it("buildCreateMarket has Menu back button", () => {
    const resp = buildCreateMarket(BASE);
    const elements = resp.ui.elements;
    const hasMenuBack = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label === "\u2190 Menu",
    );
    expect(hasMenuBack).toBe(true);
  });

  it("buildResolveView shows resolve buttons with custom labels", () => {
    const resp = buildResolveView(sampleMarket, 0, 3, 73, BASE);
    const elements = resp.ui.elements;
    const resolveA = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label.includes("Over 5k"),
    );
    const resolveB = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label.includes("Under 5k"),
    );
    expect(resolveA).toBe(true);
    expect(resolveB).toBe(true);
  });
});
