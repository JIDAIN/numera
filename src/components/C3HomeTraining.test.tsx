import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { C3HomeTraining } from "./C3HomeTraining";

describe("C3HomeTraining", () => {
  it("starts a fixed 20-question C3 block at the chosen difficulty", () => {
    const onStart = vi.fn();
    render(<C3HomeTraining onStart={onStart} />);

    fireEvent.click(screen.getByRole("button", { name: "C3 分数比较" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "复杂" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "开始 20 题" }));

    expect(onStart).toHaveBeenCalledWith("L3");
  });
});
