import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EvidenceStep } from "./EvidenceStep";
import { dictionaries } from "../lib/i18n";
import { scoreEvidence, type EvidenceState } from "../lib/mockApi";

afterEach(cleanup);

function EvidenceHarness() {
  const [evidence, setEvidence] = useState<EvidenceState>({ beneficiaryId: true, paymentDates: true, paymentScreenshot: false, bankReference: false });
  return <EvidenceStep evidence={evidence} score={scoreEvidence(evidence)} dictionary={dictionaries.en} onToggle={(key) => setEvidence((current) => ({ ...current, [key]: !current[key] }))} onMockUpload={() => setEvidence((current) => ({ ...current, paymentScreenshot: true }))} onContinue={() => undefined} />;
}

describe("EvidenceStep", () => {
  it("updates the completeness score when a screenshot is added", () => {
    render(<EvidenceHarness />);

    expect(screen.getByText(/50%/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add screenshot/i }));

    expect(screen.getByText(/75%/i)).toBeInTheDocument();
    expect(screen.getByText(/screenshot added/i)).toBeInTheDocument();
  });
});
