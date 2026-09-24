import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { C1HomeTraining } from "./C1HomeTraining";

describe("C1HomeTraining", () => {
  it("starts a fixed 20-question C1 block at the chosen difficulty", () => {
    const onStart = vi.fn();
    render(<C1HomeTraining onStart={onStart} />);

    fireEvent.click(screen.getByRole("button", { name: "C1 乘法放缩" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "复杂" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "开始 20 题" }));

    expect(onStart).toHaveBeenCalledWith("L3");
  });
});
