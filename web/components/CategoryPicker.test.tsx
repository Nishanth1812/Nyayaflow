import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CategoryPicker } from "./CategoryPicker";
import { dictionaries } from "../lib/i18n";
import { CATEGORY_OPTIONS, type Category } from "../lib/mockApi";

afterEach(cleanup);

describe("CategoryPicker", () => {
  it("shows five problem cards and sends the selected category", () => {
    const onSelect = vi.fn<(category: Category) => void>();
    render(<CategoryPicker dictionary={dictionaries.en} options={CATEGORY_OPTIONS} onSelect={onSelect} />);

    expect(screen.getByRole("heading", { name: /what's the problem/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.getByText(/PM-KISAN payment stopped/i)).toBeInTheDocument();
    expect(screen.getByText(/EPFO PF claim rejected/i)).toBeInTheDocument();
    expect(screen.getByText(/Income tax refund delayed/i)).toBeInTheDocument();
    expect(screen.getByText(/Scholarship payment stuck/i)).toBeInTheDocument();
    expect(screen.getByText(/MGNREGA wage not paid/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /EPFO PF claim rejected/i }));

    expect(onSelect).toHaveBeenCalledWith("epfo_claim_rejected");
  });
});
