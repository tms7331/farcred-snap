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
  optionA: "Over 5k",
  optionB: "Under 5k",
  votesA: 527,
  votesB: 320,
  resolved: false,
  outcome: null,
};

describe("screen builders", () => {
  it("buildMarketView returns valid snap response", () => {
    const resp = buildMarketView(sampleMarket, 0, 3, 73, null, BASE);
    expect(resp.version).toBe("1.0");
    expect(resp.ui.root).toBeDefined();
    expect(resp.ui.elements).toBeDefined();
    const root = resp.ui.elements[resp.ui.root];
    expect(root.children!.length).toBeLessThanOrEqual(7);
  });

  it("buildMarketView shows bet info when user already bet", () => {
    const resp = buildMarketView(
      sampleMarket, 0, 3, 73,
      { side: "a", amount: 25 },
      BASE,
    );
    const elements = resp.ui.elements;
    const hasBetText = Object.values(elements).some(
      (el: any) => el.type === "text" && el.props.content.includes("25 votes on Over 5k"),
    );
    expect(hasBetText).toBe(true);
  });

  it("buildEmptyState returns create button", () => {
    const resp = buildEmptyState(100, BASE);
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const hasCreateBtn = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label.includes("Create"),
    );
    expect(hasCreateBtn).toBe(true);
  });

  it("buildPlaceBet includes toggle group with amount options", () => {
    const resp = buildPlaceBet(sampleMarket, "a", 73, BASE);
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const toggle = Object.values(elements).find(
      (el: any) => el.type === "toggle_group",
    ) as any;
    expect(toggle).toBeDefined();
    expect(toggle.props.name).toBe("amount");
    expect(toggle.props.options).toContain("5");
    expect(toggle.props.options).toContain("73");
  });

  it("buildConfirmation shows confetti effect", () => {
    const resp = buildConfirmation(sampleMarket, "a", 25, 48, BASE);
    expect(resp.effects).toContain("confetti");
  });

  it("buildCreateMarket includes question and option inputs", () => {
    const resp = buildCreateMarket(BASE);
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const inputs = Object.values(elements).filter(
      (el: any) => el.type === "input",
    ) as any[];
    expect(inputs.length).toBe(3);
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
