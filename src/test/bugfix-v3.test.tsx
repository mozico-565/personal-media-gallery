import "fake-indexeddb/auto";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { GalleryProvider } from "@/gallery/store";
import { BottomSheet, MediaView } from "@/gallery/shared";
import type { MediaItem } from "@/gallery/types";

const wrapper = ({ children }: { children: ReactNode }) => (
  <GalleryProvider>{children}</GalleryProvider>
);
class TestPointerEvent extends MouseEvent {
  pointerId: number;
  isPrimary: boolean;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.isPrimary = init.isPrimary ?? true;
  }
}
beforeEach(() => {
  vi.stubGlobal("PointerEvent", TestPointerEvent);
  Element.prototype.setPointerCapture = vi.fn();
  URL.createObjectURL = vi.fn(() => "blob:test");
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("comment sheet gestures", () => {
  it("tracks the handle, snaps back, cancels, and dismisses a long drag", () => {
    const close = vi.fn();
    render(
      <BottomSheet open onClose={close} title="Comments" swipeToDismiss>
        <div>content</div>
      </BottomSheet>,
    );
    const handle = screen.getByTestId("sheet-drag-handle");
    const panel = screen.getByRole("dialog");
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 120 });
    expect(panel.style.transform).toBe("translateY(20px)");
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 120 });
    expect(close).not.toHaveBeenCalled();
    expect(panel.style.transform).toBe("translateY(0px)");
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 200 });
    fireEvent.pointerCancel(handle, { pointerId: 1 });
    expect(close).not.toHaveBeenCalled();
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 210 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 210 });
    expect(close).toHaveBeenCalledOnce();
  });
});
describe("video recovery", () => {
  it("offers retry after media failure and clears the failure on a new source", async () => {
    const video: MediaItem = {
      id: "one",
      kind: "video",
      src: "blob:one",
      source: "device",
      width: 10,
      height: 10,
    };
    const view = render(<MediaView m={video} />, { wrapper });
    fireEvent.error(view.container.querySelector("video")!);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(view.container.querySelector("video")).toHaveAttribute("src", "blob:one");
    fireEvent.error(view.container.querySelector("video")!);
    view.rerender(<MediaView m={{ ...video, src: "blob:two" }} />);
    await waitFor(() =>
      expect(view.container.querySelector("video")).toHaveAttribute("src", "blob:two"),
    );
  });
});
