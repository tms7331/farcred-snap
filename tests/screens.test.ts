import { describe, it, expect } from "vitest";
import {
  buildMarketView,
  buildEmptyState,
  buildCreateMarket,
  buildResolveView,
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
  it("buildMarketView shows bar_chart and toggle groups for active market", () => {
    const resp = buildMarketView(sampleMarket, 0, 3, 73, null, false, BASE);
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const chart = Object.values(elements).find((el: any) => el.type === "bar_chart") as any;
    expect(chart).toBeDefined();
    expect(chart.props.bars).toHaveLength(2);
    const toggles = Object.values(elements).filter((el: any) => el.type === "toggle_group") as any[];
    expect(toggles).toHaveLength(2);
  });

  it("buildMarketView shows badge when user already bet", () => {
    const resp = buildMarketView(
      sampleMarket, 0, 3, 73,
      { side: "a", amount: 25 },
      false,
      BASE,
    );
    const elements = resp.ui.elements;
    const badge = Object.values(elements).find(
      (el: any) => el.type === "badge" && el.props.label.includes("25 cred on Over 5k"),
    );
    expect(badge).toBeDefined();
    // No toggle groups when already bet
    const toggles = Object.values(elements).filter((el: any) => el.type === "toggle_group");
    expect(toggles).toHaveLength(0);
  });

  it("buildMarketView shows resolve nav for creators", () => {
    const resp = buildMarketView(sampleMarket, 0, 3, 73, null, true, BASE);
    const elements = resp.ui.elements;
    const hasResolve = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label === "Resolve",
    );
    expect(hasResolve).toBe(true);
  });

  it("buildEmptyState returns create button without logo", () => {
    const resp = buildEmptyState(100, BASE);
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const root = elements[resp.ui.root];
    expect(root.children).not.toContain("logo");
    const hasCreateBtn = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label.includes("Create"),
    );
    expect(hasCreateBtn).toBe(true);
  });

  it("buildCreateMarket includes question and option inputs", () => {
    const resp = buildCreateMarket(BASE);
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const inputs = Object.values(elements).filter((el: any) => el.type === "input") as any[];
    expect(inputs).toHaveLength(3);
    const names = inputs.map((i: any) => i.props.name).sort();
    expect(names).toEqual(["optionA", "optionB", "question"]);
  });

  it("buildResolveView shows resolve buttons with custom labels", () => {
    const resp = buildResolveView(sampleMarket, 0, 3, 73, BASE);
    expect(resp.version).toBe("1.0");
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
