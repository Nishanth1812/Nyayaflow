import { describe, expect, it } from "vitest";
import {
  createAppeal,
  diagnose,
  getDemoIntake,
  getRoutingDecision,
  scoreEvidence,
  translateStatus,
  type DiagnosticAnswers,
  type OfficialStatus,
} from "./mockApi";

const allYes: DiagnosticAnswers = {
  eKycComplete: true,
  bankAadhaarSeeded: true,
  npciMappingActive: true,
  landRecordNameMatch: true,
};

describe("NyayaFlow mock API", () => {
  it("stops diagnosis at the first No", () => {
    const result = diagnose({
      eKycComplete: false,
      bankAadhaarSeeded: false,
      npciMappingActive: true,
      landRecordNameMatch: true,
    });

    expect(result.failedCheck).toBe("eKycComplete");
    expect(result.outcome).toBe("needs_action");
  });

  it("recommends the PM-KISAN department when every check is Yes", () => {
    const result = diagnose(allYes);

    expect(result.outcome).toBe("ready_to_file");
    expect(result.recommendedDepartment).toContain("PM-KISAN");
  });

  it("returns a fictional intake with the requested complaint", () => {
    expect(getDemoIntake().complaint).toContain("PM-KISAN instalment");
    expect(getDemoIntake().beneficiaryId).toMatch(/^PMK-/);
  });

  it("routes the PM-KISAN complaint with an explainable reason", () => {
    const result = getRoutingDecision({
      category: "pm_kisan_payment_failure",
      issueDescription: "My PM-KISAN instalment stopped after two payments.",
    });

    expect(result.department).toContain("PM-KISAN");
    expect(result.reason.toLowerCase()).toContain("instalment");
    expect(result.reason.toLowerCase()).toContain("land-record");
  });

  it("scores four required evidence items evenly", () => {
    expect(
      scoreEvidence({
        beneficiaryId: true,
        paymentDates: true,
        paymentScreenshot: false,
        bankReference: false,
      }),
    ).toEqual({ completed: 2, total: 4, percentage: 50 });
  });

  it.each([
    ["Under process", "The department has not completed a final action yet."],
    [
      "Disposed",
      "The department has closed the complaint; this does not necessarily mean payment or service was received.",
    ],
    [
      "Sent to department",
      "Your complaint has been routed, but action may not have started.",
    ],
    [
      "Awaiting clarification",
      "The department may need more information from you.",
    ],
  ] as [OfficialStatus, string][])('translates "%s" exactly', (status, explanation) => {
    expect(translateStatus(status)).toBe(explanation);
  });

  it("creates an unresolved appeal that names the missing remedy", () => {
    const appeal = createAppeal({
      originalComplaint: "My PM-KISAN instalment stopped after two payments.",
      department: "Ministry of Agriculture and Farmers Welfare — PM-KISAN Cell",
      status: "Disposed",
      missingRemedy: "The pending instalment has still not been credited.",
      referenceNumber: "NYA-2026-0427",
    });

    expect(appeal).toContain("PM-KISAN instalment stopped");
    expect(appeal).toContain("pending instalment");
    expect(appeal).toContain("NYA-2026-0427");
  });
});
