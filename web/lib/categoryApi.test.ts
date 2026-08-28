import { describe, expect, it } from "vitest";
import { getDepartmentOptions, getDiagnosticRules, getRoutingDecision, type Category } from "./mockApi";

describe("category-aware mock API", () => {
  it.each([
    ["epfo_claim_rejected", /UAN/i, /PF withdrawal/i],
    ["income_tax_refund_delayed", /PAN/i, /refund/i],
    ["scholarship_nsp_payment_stuck", /application/i, /scholarship/i],
  ] as [Category, RegExp, RegExp][])('returns the backend-shaped rule set for "%s"', (category, firstQuestion, routingWord) => {
    const result = getDiagnosticRules(category);

    expect(result.category).toBe(category);
    expect(result.questions).toHaveLength(4);
    expect(result.questions[0].question).toMatch(firstQuestion);
    expect(result.routing.reason).toMatch(routingWord);
  });

  it("keeps PM-KISAN routing copy intact", () => {
    const result = getRoutingDecision({ category: "pm_kisan_payment_failure", issueDescription: "My instalment stopped." });

    expect(result.reason).toContain("PM-KISAN instalments and land-record verification");
  });

  it("returns a category department plus a safe fallback", () => {
    const departments = getDepartmentOptions("epfo_claim_rejected");

    expect(departments[0]).toMatch(/EPFO/i);
    expect(departments[1]).toMatch(/general/i);
  });
});
