import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComplaintDraftStep } from "./ComplaintDraftStep";
import { dictionaries } from "../lib/i18n";
import { DEPARTMENTS, type RoutingDecision } from "../lib/mockApi";

afterEach(cleanup);

const routing: RoutingDecision = {
  department: DEPARTMENTS[0],
  reason: "We selected this department because your issue mentions PM-KISAN instalments and land-record verification.",
  matchedRule: "pm_kisan",
};

describe("ComplaintDraftStep", () => {
  it("shows the routing reason and allows the draft to be edited", () => {
    const onDraftChange = vi.fn();
    render(
      <ComplaintDraftStep
        draft="My draft complaint"
        routing={routing}
        departments={[...DEPARTMENTS]}
        selectedDepartment={DEPARTMENTS[0]}
        dictionary={dictionaries.en}
        onDraftChange={onDraftChange}
        onDepartmentChange={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByText(/mentions pm-kisan instalments and land-record/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/complaint draft/i), { target: { value: "An edited complaint" } });
    expect(onDraftChange).toHaveBeenCalledWith("An edited complaint");
  });
});
