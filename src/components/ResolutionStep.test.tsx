import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResolutionStep } from "./ResolutionStep";
import { dictionaries, type ResolutionKey } from "../lib/i18n";

afterEach(cleanup);

function ResolutionHarness() {
  const [outcome, setOutcome] = useState<ResolutionKey | undefined>();
  return <ResolutionStep complaint="My PM-KISAN instalment stopped after two payments." department="Ministry of Agriculture and Farmers Welfare — PM-KISAN Cell" status="Disposed" referenceNumber="NYA-2026-0427" dictionary={dictionaries.en} outcome={outcome} onOutcome={setOutcome} />;
}

describe("ResolutionStep", () => {
  it("creates an appeal draft for an unresolved payment", () => {
    render(<ResolutionHarness />);

    fireEvent.click(screen.getByRole("button", { name: /no, still unresolved/i }));

    expect(screen.getByText(/your appeal draft/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/My PM-KISAN instalment stopped after two payments/i)).toBeInTheDocument();
  });

  it("shows a confirmation for a resolved payment without an appeal", () => {
    render(<ResolutionHarness />);

    fireEvent.click(screen.getByRole("button", { name: /yes, resolved/i }));

    expect(screen.getByText(/thanks for closing the loop/i)).toBeInTheDocument();
    expect(screen.queryByText(/your appeal draft/i)).not.toBeInTheDocument();
  });
});
