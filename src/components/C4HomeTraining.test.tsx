import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { C4HomeTraining } from "./C4HomeTraining";

describe("C4HomeTraining", () => {
  it("shows C4 as the first available C-layer project", () => {
    render(<C4HomeTraining onStart={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "C4 特殊基准数乘除转换" }),
    ).toBeTruthy();
  });

  it("starts L1 comprehensive mixed training as a fixed 20-question block", () => {
    const onStart = vi.fn();
    render(<C4HomeTraining onStart={onStart} />);

    fireEvent.click(
      screen.getByRole("button", { name: "C4 特殊基准数乘除转换" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "开始 20 题" }),
    );

    expect(onStart).toHaveBeenCalledWith({
      difficultyBand: "L1",
      anchor: "all",
      operation: "mixed",
    });
  });

  it("supports a single L2 anchor and a single operation direction", () => {
    const onStart = vi.fn();
    render(<C4HomeTraining onStart={onStart} />);

    fireEvent.click(
      screen.getByRole("button", { name: "C4 特殊基准数乘除转换" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "困难" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "除法" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "286" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "开始 20 题" }),
    );

    expect(onStart).toHaveBeenCalledWith({
      difficultyBand: "L2",
      anchor: 286,
      operation: "divide",
    });
  });

  it("forces L3 to use cross-magnitude comprehensive training", () => {
    const onStart = vi.fn();
    render(<C4HomeTraining onStart={onStart} />);

    fireEvent.click(
      screen.getByRole("button", { name: "C4 特殊基准数乘除转换" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "复杂" }));

    expect(
      within(dialog).getByText(/L3 只做跨数量级综合/),
    ).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: "125" })).toBeNull();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "开始 20 题" }),
    );
    expect(onStart).toHaveBeenCalledWith({
      difficultyBand: "L3",
      anchor: "all",
      operation: "mixed",
    });
  });
});
