import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IntakeStep, type IntakeValues } from "./IntakeStep";
import { dictionaries } from "../lib/i18n";
import { getDemoIntake } from "../lib/mockApi";

afterEach(cleanup);

function IntakeHarness() {
  const demo = getDemoIntake();
  const [values, setValues] = useState<IntakeValues>({
    complaint: "",
    beneficiaryId: demo.beneficiaryId,
    state: demo.state,
    lastPaymentDate: demo.lastPaymentDate,
  });

  return (
    <IntakeStep
      values={values}
      dictionary={dictionaries.en}
      onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
      onVoiceInput={() => setValues((current) => ({ ...current, complaint: demo.sampleVoiceText }))}
      onContinue={() => undefined}
    />
  );
}

describe("IntakeStep", () => {
  it("inserts the sample complaint from the voice action", () => {
    render(<IntakeHarness />);

    fireEvent.click(screen.getByRole("button", { name: /try voice input/i }));

    expect(screen.getByLabelText(/what went wrong/i)).toHaveValue(getDemoIntake().sampleVoiceText);
  });

  it("exposes labels for the three clarifying fields", () => {
    render(<IntakeHarness />);

    expect(screen.getByLabelText(/^beneficiary id$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^state$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^last payment received$/i)).toBeInTheDocument();
  });
});
