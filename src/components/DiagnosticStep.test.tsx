import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiagnosticStep } from "./DiagnosticStep";
import { dictionaries } from "../lib/i18n";
import { DIAGNOSTIC_CHECKS } from "../lib/mockApi";

afterEach(cleanup);

describe("DiagnosticStep", () => {
  it("shows only the supplied question", () => {
    render(
      <DiagnosticStep
        check={DIAGNOSTIC_CHECKS[1]}
        answer={undefined}
        dictionary={dictionaries.en}
        onAnswer={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: /bank account aadhaar-seeded/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /e-kyc complete/i })).not.toBeInTheDocument();
  });

  it("renders the fix checklist after a No answer", () => {
    render(
      <DiagnosticStep
        check={DIAGNOSTIC_CHECKS[0]}
        answer={false}
        dictionary={dictionaries.en}
        onAnswer={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^no /i }));

    expect(screen.getByText(/complete e-kyc first/i)).toBeInTheDocument();
    expect(screen.getByText(/open the pm-kisan portal/i)).toBeInTheDocument();
  });
});
