import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatusTranslator } from "./StatusTranslator";
import { dictionaries } from "../lib/i18n";

afterEach(cleanup);

describe("StatusTranslator", () => {
  it("shows the caution that Disposed does not prove payment", () => {
    render(<StatusTranslator status="Disposed" statuses={["Under process", "Disposed", "Sent to department", "Awaiting clarification"]} dictionary={dictionaries.en} onStatusChange={vi.fn()} />);

    expect(screen.getByText(/does not necessarily mean payment or service was received/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/official status/i)).toHaveValue("Disposed");
  });
});
