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
    expect(resp.version).toBe("1.0");
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
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const hasCreateBtn = Object.values(elements).some(
      (el: any) => el.type === "button" && el.props.label.includes("Create"),
    );
    expect(hasCreateBtn).toBe(true);
  });

  it("buildPlaceBet includes slider with correct max", () => {
    const resp = buildPlaceBet(sampleMarket, "yes", 73, BASE);
    expect(resp.version).toBe("1.0");
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
    expect(resp.version).toBe("1.0");
    const elements = resp.ui.elements;
    const input = Object.values(elements).find(
      (el: any) => el.type === "input",
    ) as any;
    expect(input).toBeDefined();
    expect(input.props.name).toBe("question");
  });

  it("buildResolveView shows resolve buttons", () => {
    const resp = buildResolveView(sampleMarket, 0, 3, 73, BASE);
    expect(resp.version).toBe("1.0");
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
